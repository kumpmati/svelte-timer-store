import type { Readable } from 'svelte/store';

export type Timer = Readable<TimerState> & {
	start: () => void;
	end: () => void;
	pause: () => void;
	resume: () => void;
	toggle: () => void;
	reset: () => void;
};

export type TimerState = {
	status: TimerStatus;
	duration: string;
	durationMs: number;
	sections: TimerSection[];
};

type TimerSection = {
	from: number;
	to: number | null;
	label: string | null;
	duration: number;
};

type TimerStatus = 'ongoing' | 'ended' | 'paused';

export type TimerOptions = {
	persistent: boolean;
};
