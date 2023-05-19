import { get, writable } from 'svelte/store';
import { formatDuration, parseDuration } from './format';
import type {
	TimerState,
	Timer,
	TimerSection,
	TimerOptions,
	CallbackFunc,
	TimerEvent,
	Lap
} from './types';
import { copy } from './util';

const createInitialState = (opts?: TimerOptions): TimerState => ({
	status: 'stopped',
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
	const state = writable<TimerState>(copy(createInitialState(opts)));
	const listeners = new Map<string, CallbackFunc[]>();

	let interval: any;

	/**
	 * INTERNAL: updates the total duration and latest
	 * section's duration every 16ms
	 */
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

			prev = copy(createInitialState(opts));

			// insert new section into the timer
			prev.sections = [...prev.sections, createSection(label)];
			prev.status = 'ongoing';

			setTimeout(startInterval, 1);

			return prev;
		});

		_emit('start');
	};

	/**
	 * Stops the timer, but does not clear it.
	 */
	const stop = () => {
		state.update((prev) => {
			if (isStopped(prev) || !isOngoingTimer(prev)) {
				return prev;
			}

			const section = getLastSection(prev);
			if (!section || !isOngoingSection(section)) {
				return prev;
			}

			section.to = Date.now();
			section.duration = section.to - section.from;

			prev.status = 'stopped';

			stopInterval();

			return prev;
		});

		_emit('stop');
	};

	/**
	 * Pauses the timer. If the timer is stopped or already paused, this does nothing.
	 */
	const pause = () => {
		state.update((prev) => {
			if (isStopped(prev) || !isOngoingTimer(prev)) {
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

		_emit('pause');
	};

	/**
	 * Resumes the timer. If the timer is stopped or already paused, this does nothing.
	 * @param label (Optional) Give a name to the new section
	 */
	const resume = (label?: string) => {
		state.update((prev) => {
			if (isStopped(prev) || isOngoingTimer(prev)) {
				return prev;
			}

			// start a new section in the timer
			prev.sections = [...prev.sections, createSection(label)];
			prev.status = 'ongoing';

			startInterval();

			return prev;
		});

		_emit('resume');
	};

	/**
	 * Resets the timer to its initial state, clearing any previous information.
	 */
	const reset = () => {
		state.update(() => {
			stopInterval();
			return copy(createInitialState(opts));
		});

		_emit('reset');
	};

	/**
	 * Marks a new lap in the timer. Does nothing if the timer isn't running.
	 */
	const lap = () => {
		state.update((prev) => {
			if (isStopped(prev) || !isOngoingTimer(prev)) {
				return prev;
			}

			const now = Date.now();

			const lastLap = getLastLap(prev);
			const startTime = getLastSection(prev)?.from ?? prev.startTime;

			const newLap: Lap = {
				timestamp: now,
				durationSinceLastLap: now - (lastLap?.timestamp ?? startTime),
				durationSinceStart: now - startTime
			};

			prev.laps = [...prev.laps, newLap];
			return prev;
		});

		_emit('lap');
	};

	/**
	 * Starts/resumes the timer when it's not running, or pauses it when running.
	 * @param (Optional) label for the section
	 */
	const toggle = (label?: string) => {
		const s = get(state);
		if (s.status === 'stopped') {
			return start(label);
		} else if (s.status === 'ongoing') {
			return pause();
		} else if (s.status === 'paused') {
			return resume(label);
		}
	};

	/**
	 * (Internal) emits an event
	 */
	const _emit = (e: TimerEvent) => {
		const l = listeners.get(e);
		if (!l) return;

		l.forEach((cb) => cb());
	};

	/**
	 * Adds an event listener to listen to timer events.
	 * @param event Event type
	 * @param cb Callback function
	 */
	const on = (event: TimerEvent, cb: CallbackFunc) => {
		const l = listeners.get(event) ?? [];

		l.push(cb);
		listeners.set(event, l);
	};

	/**
	 * Removes an event listener from the timer.
	 * @param event Event type
	 * @param cb Callback function
	 */
	const off = (event: TimerEvent, cb: CallbackFunc) => {
		const l = listeners.get(event);
		if (!l) return;

		l.splice(l.indexOf(cb), 1);
		listeners.set(event, l);
	};

	return {
		subscribe: state.subscribe,
		start,
		stop,
		pause,
		resume,
		toggle,
		reset,
		lap,
		on,
		off
	};
};

const createSection = (label?: string): TimerSection => ({
	from: Date.now(),
	to: null,
	label: label ?? null,
	duration: 0
});

const getLastSection = (s: TimerState): TimerSection | null => s.sections.at(-1) ?? null;
const isOngoingSection = (s: TimerSection | null): boolean => (s ? s.to === null : false);
const isStopped = (s: TimerState): boolean => s.status === 'stopped';
const isOngoingTimer = (s: TimerState): boolean => isOngoingSection(getLastSection(s));
const getLastLap = (s: TimerState): Lap | null => s.laps.at(-1) ?? null;

const calculateTotalDuration = (s: TimerState) => {
	return s.sections.reduce((total, curr) => {
		if (curr.to) return total + (curr.to - curr.from);

		return total + curr.duration;
	}, 0);
};
