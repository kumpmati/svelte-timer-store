import { writable } from 'svelte/store';
import { formatDuration, parseDuration } from './format';
import type { TimerState, Timer, TimerSection, TimerOptions } from './types';
import { copy } from './util';

const initialState = (opts?: TimerOptions): TimerState => ({
	status: 'ended',
	startTime: Date.now(),
	duration: parseDuration(0),
	durationString: formatDuration({ h: 0, m: 0, s: 0, ms: 0 }, opts?.showMs),
	sections: [],
	laps: []
});

/**
 * Creates a timer store
 */
export const createTimer = (opts?: TimerOptions): Timer => {
	const state = writable<TimerState>(copy(initialState(opts)));

	let interval: any;

	// INTERNAL: updates the total duration and latest
	// section's duration every second
	const startInterval = () => {
		stopInterval();

		const update = () => {
			state.update((prev) => {
				if (!isOngoingTimer(prev)) {
					stopInterval();
					return prev;
				}

				const section = getLastSection(prev);
				if (!section) {
					return prev;
				}

				section.duration = Date.now() - section.from;
				const total = calculateTotalDuration(prev);
				prev.duration = parseDuration(total);
				prev.durationString = formatDuration(prev.duration, opts?.showMs);

				return prev;
			});
		};

		interval = setInterval(update, 16);
		update();
	};

	const stopInterval = () => {
		clearInterval(interval);
		interval = null;
	};

	/**
	 * Resets and starts the timer. If the timer is already ongoing, this does nothing.
	 * @param label
	 */
	const start = (label?: string) => {
		state.update((prev) => {
			if (isOngoingTimer(prev)) {
				return prev;
			}

			prev = copy(initialState(opts));

			// insert new section into the timer
			prev.sections = [...prev.sections, createSection(label)];
			prev.status = 'ongoing';

			setTimeout(startInterval, 1);

			return prev;
		});
	};

	/**
	 * Ends the timer
	 */
	const end = () => {
		state.update((prev) => {
			if (isEnded(prev) || !isOngoingTimer(prev)) {
				return prev;
			}

			const section = getLastSection(prev);
			if (!section || !isOngoingSection(section)) {
				return prev;
			}

			section.to = Date.now();
			section.duration = section.to - section.from;

			prev.status = 'ended';

			stopInterval();

			return prev;
		});
	};

	/**
	 * Pauses the timer. If the timer is ended or already paused, this does nothing.
	 */
	const pause = () => {
		state.update((prev) => {
			if (isEnded(prev) || !isOngoingTimer(prev)) {
				return prev;
			}

			stopInterval();

			const section = getLastSection(prev);
			if (section && isOngoingSection(section)) {
				section.to = Date.now();
				section.duration = section.to - section.from;
			}

			prev.status = 'paused';

			return prev;
		});
	};

	/**
	 * Resumes the timer. If the timer is ended or already paused, this does nothing.
	 * @param label (Optional) Give a name to the new section
	 */
	const resume = (label?: string) => {
		state.update((prev) => {
			if (isEnded(prev) || isOngoingTimer(prev)) {
				return prev;
			}

			// start a new section in the timer
			prev.sections = [...prev.sections, createSection(label)];
			prev.status = 'ongoing';

			startInterval();

			return prev;
		});
	};

	/**
	 * Resets the timer, allowing the timer to be started again. The timer can be reset anytime.
	 */
	const reset = () => {
		state.update(() => {
			stopInterval();
			return copy(initialState(opts));
		});
	};

	/**
	 * Marks a new lap in the timer
	 */
	const lap = () => {
		state.update((prev) => {
			prev.laps = [...prev.laps, Date.now()];
			return prev;
		});
	};

	return {
		subscribe: state.subscribe,
		start,
		end,
		pause,
		resume,
		reset,
		lap
	};
};

const createSection = (label?: string): TimerSection => ({
	from: Date.now(),
	to: null,
	label: label ?? null,
	duration: 0
});

const getLastSection = (s: TimerState): TimerSection | null =>
	s.sections.length > 0 ? s.sections[s.sections.length - 1] : null;

const isOngoingSection = (s: TimerSection): boolean => {
	return s.to === null;
};

const isOngoingTimer = (s: TimerState): boolean => {
	const section = getLastSection(s);
	return section ? isOngoingSection(section) : false;
};

const isEnded = (s: TimerState): boolean => s.status === 'ended';

const calculateTotalDuration = (s: TimerState) => {
	return s.sections.reduce((total, curr) => {
		if (curr.to) return total + (curr.to - curr.from);

		return total + curr.duration;
	}, 0);
};
