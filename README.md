# Svelte timer store

Simple timer store with support for pausing and laps.

## Installation

This is a simple library that utilises Svelte's [stores](https://svelte.dev/tutorial/writable-stores), therefore Svelte is required to use it.

Installation is done using your favourite package manager:

```bash
# npm
npm install svelte-timer-store

# pnpm
pnpm install svelte-timer-store

# yarn
yarn add svelte-timer-store
```

## Features

- Ability to pause and resume timer (sections)
  - Ability to add labels to sections
- Laps
- Timer state is presented as a readable store
- Functions to `start`, `stop`, `pause`, `resume`, `toggle`, `reset` and do a `lap`

## Usage

To use the timer, import the `createTimer` function. The function can then be used to construct the timer store:

```html
<script>
	import { createTimer } from 'svelte-timer-store';

	const timer = createTimer({ showMs: true, updateInterval: 100 });

	const handleSave = () => {
		const state = timer.save();
		someFunctionToPersistState(state);
	};

	onMount(async () => {
		const savedState = await someFunctionToLoadState();
		timer.load(savedState);
	});
</script>

<!-- Subscribing to the store allows you to read its current state -->
<p>Status: {$timer.status}</p>
<p>Duration: {$timer.durationString}</p>

<!-- You can read the timer's sections in realtime -->
<ul>
	{#each $timer.sections as section}
	<li>
		<p>Started: {new Date(section.from).toTimeString()}</p>
		<p>Duration: {section.duration / 1000}s</p>
	</li>
	{/each}
</ul>

<!-- And also the laps -->
<ul>
	{#each $timer.laps as lap}
	<li>
		<p>Duration: {lap.durationSinceLastLap / 1000}s</p>
	</li>
	{/each}
</ul>

<!-- All available timer controls -->
<button on:click="{timer.start}">Start timer</button>
<button on:click="{timer.stop}">Stop timer</button>
<button on:click="{timer.pause}">Pause timer</button>
<button on:click="{timer.resume}">Resume timer</button>
<button on:click="{timer.toggle}">Toggle timer</button>
<button on:click="{timer.reset}">Reset timer</button>
<button on:click="{timer.lap}">New lap</button>
```

## Reference

### `createTimer(opts?: TimerOptions)`

Constructs the timer store.

Options:

- `showMs`?: boolean - If true, milliseconds are included in the duration string
- `updateInterval`?: number - How often in milliseconds to update the calculated duration

### `timer.start(label?: string)`

Starts the timer, starting a new section.
You can provide an optional label for the started section.

### `timer.stop()`

Stops the timer while retaining all sections and laps. Only works if the timer is running.

### `timer.pause()`

Pauses the timer, ending the current section. Only works if the timer is running.

### `timer.resume(label?: string)`

Resumes the timer, starting a new section. Only works if the timer is paused.

### `timer.toggle(label?: string)`

Convenience function to start, pause or resume the timer based on the current state.

You can provide an optional label for when a new section is started.

### `timer.lap()`

Adds a new lap.

### `timer.reset()`

Resets the timer to its initial state, clearing all sections and laps.

```

```
