<script lang="ts">
  import { call_event_rename, call_event_upsert } from '$lib/api';
  import CardEvent from '$lib/components/CardEvent.svelte';
  import MinusButton from '$lib/components/button/MinusButton.svelte';
  import PlusButton from '$lib/components/button/PlusButton.svelte';
  import ToggleButton from '$lib/components/button/ToggleButton.svelte';
  import Input from '$lib/components/form/Input.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import PageTitle from '$lib/components/layout/PageTitle.svelte';
  import Section from '$lib/components/layout/Section.svelte';
  import type { EventWithRecipes } from '$lib/types';

  let { data } = $props();

  // local, mutable copy of the loaded data; kept in sync via card callbacks
  // svelte-ignore state_referenced_locally
  let events: EventWithRecipes[] = $state(data.events);
  // re-sync when load data changes (e.g. after a data import calls invalidateAll)
  $effect(() => {
    events = data.events;
  });
  let addToggle: ToggleButton;

  const findEvent = (name: string) => events.find((e) => e.name === name);

  async function addEvent(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (new FormData(form).get('name') as string).trim();
    if (!name) return;
    const event = await call_event_upsert(name);
    if (!findEvent(name)) events.push(event);
    addToggle.hide();
  }

  function updatePrice(name: string, price: number) {
    const event = findEvent(name);
    if (event) event.price = price;
  }

  async function renameEvent(name: string, newName: string) {
    await call_event_rename(name, newName);
    const event = findEvent(name);
    if (event) event.name = newName;
  }

  function reorderRecipes(name: string, order: string[]) {
    const event = findEvent(name);
    if (!event) return;
    const pos = new Map(order.map((n, i) => [n, i]));
    event.recipes = [...event.recipes].sort(
      (a, b) => (pos.get(a.name) ?? Infinity) - (pos.get(b.name) ?? Infinity),
    );
  }

  function deleteEvent(name: string) {
    events = events.filter((e) => e.name !== name);
  }

  function upsertEventRecipe(upsert: {
    event: string;
    recipe: string;
    amount: number;
  }) {
    const event = findEvent(upsert.event);
    if (!event) return;
    const recipe = event.recipes.find((r) => r.name === upsert.recipe);
    if (recipe) recipe.amount = upsert.amount;
    else event.recipes.push({ name: upsert.recipe, amount: upsert.amount });
  }

  function deleteEventRecipe(del: { event: string; recipe: string }) {
    const event = findEvent(del.event);
    if (event)
      event.recipes = event.recipes.filter((r) => r.name !== del.recipe);
  }
</script>

<Section>
  <PageTitle>Events</PageTitle>
  <ToggleButton bind:this={addToggle} buttonText="Event hinzufügen">
    <form onsubmit={addEvent} class="flex items-center space-x-2">
      <Input placeholder="Eventname" name="name" required />
      <PlusButton type="submit" title="Hinzufügen" />
      <MinusButton
        type="button"
        title="Abbrechen"
        onclick={() => addToggle.hide()}
      />
    </form>
  </ToggleButton>

  <Grid>
    {#each events as event (event.name)}
      <CardEvent
        name={event.name}
        price={event.price}
        recipes={event.recipes}
        recipeNames={data.recipeNames}
        alcoholicRecipes={data.alcoholicRecipes}
        onupdatePrice={updatePrice}
        ondelete={deleteEvent}
        onrename={renameEvent}
        onreorder={reorderRecipes}
        onupsertRecipe={upsertEventRecipe}
        ondeleteRecipe={deleteEventRecipe}
      />
    {/each}
  </Grid>
</Section>
