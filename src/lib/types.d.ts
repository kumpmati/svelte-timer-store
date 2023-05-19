import type { Readable } from 'svelte/store';

export type Timer = Readable<TimerState> & {
	start: () => void;
	stop: () => void;
	pause: () => void;
	resume: () => void;
	toggle: () => void;
	reset: () => void;
	lap: () => void;
	on: (e: TimerEvent, cb: CallbackFunc) => void;
	off: (e: TimerEvent, cb: CallbackFunc) => void;
};

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
	status: TimerStatus;

	/**
	 * Timestamp (in milliseconds) when the timer was first started
	 */
	startTime: number;

	/**
	 * Current total duration of the timer
	 */
	duration: Duration;

	/**
	 * Current total duration of the timer, formatted as a string (HH:mm:ss.ms)
	 */
	durationString: string;
	sections: TimerSection[];
	laps: Lap[];
};

type CallbackFunc = () => void;

type TimerEvent = 'start' | 'stop' | 'pause' | 'resume' | 'lap' | 'reset';

type TimerSection = {
	/**
	 * Timestamp of when the section was started (in milliseconds)
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
	 * Current duration of the section.
	 */
	duration: number;
};

type TimerStatus = 'ongoing' | 'stopped' | 'paused';

export type TimerOptions = {
	/**
	 * Include milliseconds in the duration string
	 */
	showMs?: boolean;
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
