<script lang="ts">
	import { createTimer } from '$lib';

	const timer = createTimer({
		showMs: true,
		persist: {
			id: '1',
			strategy: 'local'
		}
	});
</script>

<h1>durationString: {$timer.durationStr}</h1>
<h2>status: {$timer.status}</h2>
<h2>startTime: {$timer.startTime}</h2>
<h2>endtime: {$timer.endTime}</h2>

<ul>
	{#each $timer.sections as section (section.from)}
		<li>
			<p>
				{new Date(section.from).toLocaleTimeString('fi')} - {section.to
					? new Date(section.to).toLocaleTimeString('fi')
					: '<ongoing>'}
			</p>
			<p>
				Duration parts: {section.durationParts.h}:{section.durationParts.m}:{section.durationParts
					.s}.{section.durationParts.ms}
			</p>
			<p>Duration: {section.duration}</p>
			<p>Status: {section.status}</p>
		</li>
	{/each}
</ul>

{#each $timer.laps as lap}
	<p>Lap: {lap.durationSinceLastLap / 1000}s ({lap.durationSinceStart / 1000}s since start)</p>
{/each}

<button on:click={() => timer.start()}>Start</button>
<button on:click={timer.stop}>Stop</button>
<button on:click={timer.pause}>Pause</button>
<button on:click={() => timer.resume()}>Resume</button>
<button on:click={() => timer.toggle()}>Toggle</button>
<button on:click={timer.reset}>Reset</button>
<button on:click={timer.lap}>Lap</button>
