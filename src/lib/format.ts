import type { Duration } from './types';

/**
 * Parses the elapsed hours, minutes, seconds and milliseconds from the input
 * @param d duration in milliseconds
 * @returns
 */
export const parseDuration = (d: number): Duration => {
	const ms = Math.floor(d % 1000);
	const s = Math.floor((d / 1000) % 60);
	const m = Math.floor((d / 1000 / 60) % 60);
	const h = Math.floor((d / 1000 / 60 / 60) % 60);

	return { h, m, s, ms };
};

export const formatDuration = (d: Duration, showMs?: boolean): string => {
	let str = '';

	if (d.h > 0) str += d.h.toString(); // hours
	str += d.m.toString().padStart(2, '0'); // minutes
	str += ':' + d.s.toString().padStart(2, '0'); // seconds
	if (showMs) {
		str += '.' + d.ms.toString().padStart(3, '0'); // milliseconds
	}

	return str;
};
