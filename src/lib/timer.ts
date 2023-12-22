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
import { persisted } from 'svelte-local-storage-store';

const createInitialState = (opts?: TimerOptions): TimerState => ({
	status: 'stopped',
	startTime: Date.now(),
	endTime: null,
	duration: parseDuration(0),
	durationStr: formatDuration({ h: 0, m: 0, s: 0, ms: 0 }, opts?.showMs),
	sections: [],
	laps: []
});

/**
 * Creates a timer store
 */
export const createTimer = (opts: TimerOptions = { showMs: false, updateInterval: 16 }): Timer => {
	if ((opts?.updateInterval ?? 0) < 0) throw new Error('updateInterval cannot be under 0');

	const initialState = copy(createInitialState(opts));

	const state = opts.persist
		? persisted(`svelte-timer-store-${opts.persist.id}`, initialState, {
				storage: opts.persist.strategy ?? 'local'
		  })
		: writable(initialState);

	const listeners = new Map<string, CallbackFunc[]>();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let interval: any;

	const stopInterval = () => {
		clearInterval(interval);
		interval = null;
	};

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
				section.durationParts = parseDuration(section.duration);
				const total = calculateTotalDuration(prev);
				prev.duration = parseDuration(total);
				prev.durationStr = formatDuration(prev.duration, opts.showMs);

				return prev;
			});
		};

		interval = setInterval(update, opts.updateInterval);
		update();
	};

	if (opts.persist) {
		startInterval();
	}

	/**
	 * Resets and starts the timer. If the timer is already ongoing, this does nothing.
	 * @param label
	 */
	const start: Timer['start'] = (label) => {
		state.update((prev) => {
			if (isOngoingTimer(prev) || prev.status !== 'stopped') {
				return prev;
			}

			prev = copy(createInitialState(opts));

			// insert new section into the timer
			prev.sections = [...prev.sections, createSection(prev.startTime, label)];
			prev.status = 'ongoing';

			setTimeout(startInterval, 1);

			return prev;
		});

		_emit('start');
	};

	/**
	 * Stops the timer, but does not clear it.
	 *
	 * After the timer has been stopped, it cannot be resumed without resetting.
	 */
	const stop: Timer['stop'] = () => {
		state.update((prev) => {
			const section = getLastSection(prev);

			const now = Date.now();

			if (section && isOngoingSection(section)) {
				section.to = now;
				section.duration = section.to - section.from;
				section.durationParts = parseDuration(section.duration);
				section.status = 'stopped';
			}

			prev.status = 'stopped';
			prev.endTime = now;

			stopInterval();

			return prev;
		});

		_emit('stop');
	};

	/**
	 * Pauses the timer. If the timer is stopped or already paused, this does nothing.
	 */
	const pause: Timer['pause'] = () => {
		state.update((prev) => {
			if (isStopped(prev) || !isOngoingTimer(prev)) {
				return prev;
			}

			stopInterval();

			const section = getLastSection(prev);

			if (section && isOngoingSection(section)) {
				section.to = Date.now();
				section.duration = section.to - section.from;
				section.durationParts = parseDuration(section.duration);
				section.status = 'stopped';
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
	const resume: Timer['resume'] = (label) => {
		state.update((prev) => {
			if (isStopped(prev) || isOngoingTimer(prev)) {
				return prev;
			}

			// start a new section in the timer
			prev.sections = [...prev.sections, createSection(Date.now(), label)];
			prev.status = 'ongoing';

			startInterval();

			return prev;
		});

		_emit('resume');
	};

	/**
	 * Resets the timer to its initial state, clearing any previous information.
	 */
	const reset: Timer['reset'] = () => {
		state.update(() => {
			stopInterval();
			return copy(createInitialState(opts));
		});

		_emit('reset');
	};

	/**
	 * Marks a new lap in the timer. Does nothing if the timer isn't running.
	 */
	const lap: Timer['lap'] = () => {
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
	const toggle: Timer['toggle'] = (label) => {
		const s = get(state);

		switch (s.status) {
			case 'stopped':
				return start(label);

			case 'ongoing':
				return pause();

			case 'paused':
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
	const on: Timer['on'] = (event, cb) => {
		const l = listeners.get(event) ?? [];

		l.push(cb);
		listeners.set(event, l);
	};

	/**
	 * Removes an event listener from the timer.
	 * @param event Event type
	 * @param cb Callback function
	 */
	const off: Timer['off'] = (event, cb) => {
		const l = listeners.get(event);
		if (!l) return;

		l.splice(l.indexOf(cb), 1);
		listeners.set(event, l);
	};

	/**
	 * Replaces the current timer state with the given state.
	 *
	 * @param data
	 */
	const load: Timer['load'] = (data) => {
		state.set(data);
		startInterval();
	};

	/**
	 * Returns the current timer state.
	 *
	 * Useful for saving the timer state externally.
	 *
	 * @returns Timer state
	 */
	const save: Timer['save'] = () => get(state);

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
		off,
		load,
		save
	};
};

const createSection = (from: number, label?: string): TimerSection => ({
	from,
	to: null,
	label: label ?? null,
	duration: 0,
	durationParts: parseDuration(0),
	status: 'ongoing'
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
