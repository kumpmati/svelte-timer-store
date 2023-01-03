import { writable } from 'svelte/store';
import { formatDuration } from './format';
import type { TimerState, Timer, TimerSection } from './types';
import { copy } from './util';

const stub: TimerState = {
	status: 'ended',
	duration: formatDuration(0),
	durationMs: 0,
	sections: []
};

/**
 * Creates a timer store
 */
export const createTimer = (): Timer => {
	const state = writable<TimerState>(copy(stub));

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
				prev.durationMs = calculateTotalDuration(prev);
				prev.duration = formatDuration(prev.durationMs);

				return prev;
			});
		};

		interval = setInterval(update, 1000);
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
			if (!isEnded(prev)) {
				return prev;
			}

			startInterval();

			prev = copy(stub);

			// insert new section into the timer
			prev.sections = [...prev.sections, createSection(label)];
			prev.status = 'ongoing';

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

			stopInterval();

			const section = getLastSection(prev);
			if (!section || !isOngoingSection(section)) {
				return prev;
			}

			section.to = Date.now();
			section.duration = section.to - section.from;

			prev.status = 'ended';

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

			startInterval();

			// start a new section in the timer
			prev.sections = [...prev.sections, createSection(label)];

			prev.status = 'ongoing';

			return prev;
		});
	};

	/**
	 * Does the same as calling `resume` or `pause`, but depending on the timer state.
	 */
	const toggle = (label?: string) => {
		const unsub = state.subscribe((s) => {
			if (s.status === 'paused') {
				resume(label);
			} else if (s.status === 'ongoing') {
				pause();
			}
		});

		unsub();
	};

	/**
	 * Resets the timer, allowing the timer to be started again. The timer can be reset anytime.
	 */
	const reset = () => {
		state.update((prev) => {
			if (isEnded(prev)) {
				return prev;
			}

			stopInterval();

			prev.status = 'ended';

			const section = getLastSection(prev);
			if (section && isOngoingSection(section)) {
				section.to = Date.now();
				section.duration = section.to - section.from;
			}

			return prev;
		});
	};

	return {
		subscribe: state.subscribe,
		start,
		end,
		pause,
		resume,
		toggle,
		reset
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
		if (!curr.to) return total;

		return total + (curr.to - curr.from);
	}, 0);
};
