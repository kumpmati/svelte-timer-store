import { persisted } from 'svelte-local-storage-store';
import { formatDuration, parseDuration } from './format';
import type { TimerOptions, TimerState } from './types';
import { writable } from 'svelte/store';

export const copy = <T>(val: T): T => JSON.parse(JSON.stringify(val));

export const createInitialState = (opts?: TimerOptions): TimerState => ({
	status: 'stopped',
	startTime: Date.now(),
	endTime: null,
	duration: parseDuration(0),
	durationStr: formatDuration({ h: 0, m: 0, s: 0, ms: 0 }, opts?.showMs),
	sections: [],
	laps: []
});

export const getStore = (initialState: TimerState, persist?: TimerOptions['persist']) => {
	if (persist) {
		return persisted(`svelte-timer-store-${persist.id}`, initialState, {
			storage: persist.strategy ?? 'local'
		});
	}

	return writable(initialState);
};
