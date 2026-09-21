<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { call_export, call_import } from '$lib/api';
  import { saveTextFile } from '$lib/download';
  import Icon from '$lib/icons/Icon.svelte';
  import { ArrowDownTray, ArrowUpTray, CircleStack } from '$lib/icons';
  import type { DataExport } from '$lib/types';
  import Dropdown from './Dropdown.svelte';
  import Modal from './Modal.svelte';
  import BigButton from './button/BigButton.svelte';

  let { class: cls = '' }: { class?: string } = $props();

  let fileInput: HTMLInputElement;
  let modal: Modal;
  let pending: DataExport | null = $state(null);
  let fileName = $state('');
  let status: { ok: boolean; text: string } | null = $state(null);
  let busy = $state(false);

  const items = [
    { label: 'Export', callback: exportData, icon: ArrowDownTray },
    { label: 'Import', callback: () => fileInput.click(), icon: ArrowUpTray },
  ];

  async function exportData() {
    const data = await call_export();
    const date = (data.exportedAt ?? new Date().toISOString()).slice(0, 10);
    await saveTextFile(
      `cocktailcalc-${date}.json`,
      JSON.stringify(data, null, 2),
    );
  }

  async function fileSelected(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    status = null;
    fileName = file.name;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1) throw new Error('unsupported format');
      pending = parsed;
    } catch {
      pending = null;
      status = {
        ok: false,
        text: 'Datei konnte nicht gelesen werden (kein CocktailCalc-Export).',
      };
    }
    modal.show();
  }

  async function runImport(mode: 'merge' | 'replace') {
    if (!pending) return;
    if (
      mode === 'replace' &&
      !confirm('Wirklich alle vorhandenen Daten ersetzen?')
    )
      return;
    busy = true;
    try {
      const result = await call_import(pending, mode);
      status = {
        ok: true,
        text: `Importiert: ${result.ingredients} Zutaten, ${result.recipes} Rezepte, ${result.events} Events.`,
      };
      pending = null;
      await invalidateAll();
    } catch (e) {
      status = {
        ok: false,
        text: `Import fehlgeschlagen: ${(e as Error).message}`,
      };
    } finally {
      busy = false;
    }
  }
</script>

<Dropdown {items} class={cls}>
  <Icon
    icon={CircleStack}
    class="h-5 w-5 text-primary-800 dark:text-primary-900"
  />
</Dropdown>

<input
  bind:this={fileInput}
  type="file"
  accept="application/json,.json"
  class="hidden"
  onchange={fileSelected}
/>

<Modal bind:this={modal}>
  <h2 class="text-lg font-semibold">Daten importieren</h2>
  {#if pending}
    <p class="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
      <span class="font-medium">{fileName}</span>: {pending.ingredients.length} Zutaten,
      {pending.recipes.length} Rezepte, {pending.events.length} Events
      {#if pending.exportedAt}(exportiert am {new Date(
          pending.exportedAt,
        ).toLocaleDateString('de')}){/if}
    </p>
    <div class="mt-4 flex flex-col gap-2">
      <BigButton disabled={busy} onclick={() => runImport('merge')}
        >Zusammenführen</BigButton
      >
      <p class="text-xs text-secondary-500">
        Vorhandene Einträge werden aktualisiert, neue ergänzt.
      </p>
      <BigButton
        class="bg-red-600 hover:bg-red-500 focus-visible:outline-red-600"
        disabled={busy}
        onclick={() => runImport('replace')}
      >
        Alles ersetzen
      </BigButton>
      <p class="text-xs text-secondary-500">
        Löscht alle vorhandenen Daten vor dem Import.
      </p>
    </div>
  {/if}
  {#if status}
    <p class={['mt-3 text-sm', status.ok ? 'text-green-600' : 'text-red-600']}>
      {status.text}
    </p>
  {/if}
</Modal>
