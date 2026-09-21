<script lang="ts">
  import { setMode, userPrefersMode } from 'mode-watcher';
  import Icon from '$lib/icons/Icon.svelte';
  import { ComputerDesktop, Moon, Sun } from '$lib/icons';
  import Dropdown from './Dropdown.svelte';

  let { class: cls = '' }: { class?: string } = $props();

  const items = [
    { label: 'Hell', callback: () => setMode('light'), icon: Sun },
    { label: 'Dunkel', callback: () => setMode('dark'), icon: Moon },
    {
      label: 'System',
      callback: () => setMode('system'),
      icon: ComputerDesktop,
    },
  ];

  const current = $derived(
    userPrefersMode.current === 'light'
      ? Sun
      : userPrefersMode.current === 'dark'
        ? Moon
        : ComputerDesktop,
  );
</script>

<Dropdown {items} class={cls}>
  <Icon icon={current} class="h-5 w-5 text-primary-800 dark:text-primary-900" />
</Dropdown>
