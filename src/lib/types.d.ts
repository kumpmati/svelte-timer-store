import type { Readable } from 'svelte/store';

export type TimerOptions = {
	/**
	 * Include milliseconds in the duration string?
	 */
	showMs?: boolean;

	/**
	 * How often (in milliseconds) to calculate the current duration?
	 *
	 * Default: `16`
	 */
	updateInterval?: number;

	/**
	 * Persists the timer state into local or session storage.
	 */
	persist?: {
		/**
		 * ID to use when saving / loading the timer.
		 */
		id: string | number;

		/**
		 * Where to save the state
		 *
		 * Default: `local`
		 */
		strategy: 'local' | 'session';
	};
};

export type Timer = Readable<TimerState> & {
	start: (label?: string) => void;
	stop: () => void;
	pause: () => void;
	resume: (label?: string) => void;
	toggle: (label?: string) => void;
	reset: () => void;
	lap: () => void;
	on: (e: TimerEvent, cb: CallbackFunc) => void;
	off: (e: TimerEvent, cb: CallbackFunc) => void;

	load: (state: TimerState) => void;
	save: () => TimerState;
};

export type TimerEvent = 'start' | 'stop' | 'pause' | 'resume' | 'lap' | 'reset';

export type Lap = {
	/**
	 * Duration (in milliseconds) from the start of the timer
	 */
	durationSinceStart: number;

	/**
	 * Duration (in milliseconds) from the last lap,
	 * or the start of the last section in case of the first lap
	 */
	durationSinceLastLap: number;

	/**
	 * Timestamp (in milliseconds) of the absolute time of the lap
	 */
	timestamp: number;
};

export type TimerState = {
	/**
	 * Current status of the timer
	 */
	status: 'ongoing' | 'stopped' | 'paused';

	/**
	 * Timestamp (in milliseconds) when the timer was first started
	 */
	startTime: number;

	/**
	 * Timestamp (in milliseconds) when the timer was ended.
	 */
	endTime: number | null;

	/**
	 * Current total duration of the timer
	 */
	duration: Duration;

	/**
	 * Current total duration of the timer, formatted as a string (HH:mm:ss.ms)
	 */
	durationStr: string;

	/**
	 * Timer's sections
	 */
	sections: TimerSection[];

	/**
	 * Timer's laps
	 */
	laps: Lap[];
};

type CallbackFunc = () => void;

export type TimerSection = {
	/**
	 * Timestamp of when the section was started (in milliseconds).
	 */
	from: number;

	/**
	 * Timestamp of when the section ended (in milliseconds).
	 * If null, the section is ongoing.
	 */
	to: number | null;

	/**
	 * Label provided for the section.
	 */
	label: string | null;

	/**
	 * Current duration of the section (in milliseconds).
	 */
	duration: number;

	/**
	 * Current duration of the section divided into hours,
	 * minutes, seconds and milliseconds.
	 */
	durationParts: Duration;

	/**
	 * Current status of the section.
	 */
	status: 'ongoing' | 'stopped';
};

export type Duration = {
	/**
	 * Hour part
	 */
	h: number;

	/**
	 * Minute part
	 */
	m: number;

	/**
	 * Second part
	 */
	s: number;

	/**
	 * Millisecond part
	 */
	ms: number;
};
