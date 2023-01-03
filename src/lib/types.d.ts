import type { Readable } from 'svelte/store';

export type Timer = Readable<TimerState> & {
	start: () => void;
	end: () => void;
	pause: () => void;
	resume: () => void;
	reset: () => void;
	lap: () => void;
};

export type TimerState = {
	status: TimerStatus;
	startTime: number;
	duration: Duration;
	durationString: string;
	sections: TimerSection[];
	laps: number[];
};

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
