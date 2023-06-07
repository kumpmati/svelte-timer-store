import { createTimer } from '$lib';
import type { Timer } from '$lib/types';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const copy = <T>(val: T): T => JSON.parse(JSON.stringify(val));

let timer: Timer;

beforeEach(() => {
	timer = createTimer();
});

describe('timer store', () => {
	describe('on start', () => {
		it('should set the startTime and endTime variables, and update the status', () => {
			const now = Date.now();

			timer.start();
			const a = get(timer);

			expect(Math.abs(now - a.startTime)).toBeLessThan(10);
			expect(a.endTime).toBe(null);
			expect(a.status).toBe('ongoing');
		});

		it('should add a new ongoing section', () => {
			const now = Date.now();

			timer.start();
			const a = get(timer);

			expect(a.sections.length).toBe(1);
			expect(a.sections[0].status).toBe('ongoing');
			expect(a.sections[0].to).toBe(null);
			expect(a.sections[0].label).toBe(null);
			expect(Math.abs(now - a.sections[0].from)).toBeLessThan(10);
		});
	});

	describe('on stop', () => {
		it('should set the status to stopped and set the endTime', () => {
			timer.start();
			const a = get(timer);
			expect(a.endTime).toBe(null);

			timer.stop();
			const b = get(timer);

			expect(b.status).toBe('stopped');
			expect(b.endTime).toBeDefined();
		});

		it('should not allow resuming the timer', () => {
			timer.start();
			timer.stop();
			const a = copy(get(timer));

			timer.resume();
			const b = get(timer);

			// should not have changed
			expect(a.status).toBe(b.status);
		});

		it('should clear state when start is called', async () => {
			timer.start();

			const a = copy(get(timer));

			timer.stop();
			await sleep(10);
			timer.start();

			const b = get(timer);

			expect(a.startTime).not.toBe(b.startTime);
		});

		it('should do nothing when paused', () => {
			timer.start();
			timer.stop();
			const a = copy(get(timer));
			timer.pause();
			const b = copy(get(timer));

			expect(a).toMatchObject(b);
		});
	});
});
