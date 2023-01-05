import type { Readable } from 'svelte/store';

export type Timer = Readable<TimerState> & {
	start: () => void;
	end: () => void;
	pause: () => void;
	resume: () => void;
	reset: () => void;
	lap: () => void;
	on: (e: TimerEvent, cb: CallbackFunc) => void;
	off: (e: TimerEvent, cb: CallbackFunc) => void;
};

export type TimerState = {
	status: TimerStatus;
	startTime: number;
	duration: Duration;
	durationString: string;
	sections: TimerSection[];
	laps: number[];
};

type CallbackFunc = () => void;

type TimerEvent = 'start' | 'end' | 'pause' | 'resume' | 'lap' | 'reset';

type TimerSection = {
	from: number;
	to: number | null;
	label: string | null;
	duration: number;
};

type TimerStatus = 'ongoing' | 'ended' | 'paused';

export type TimerOptions = {
	showMs?: boolean;
};

export type Duration = {
	h: number;
	m: number;
	s: number;
	ms: number;
};
