<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { Bars3, XMark } from '$lib/icons';
  import Modal from '../Modal.svelte';
  import DataSetting from '../DataSetting.svelte';
  import ThemeSetting from '../ThemeSetting.svelte';

  const pages = [
    { title: 'Events', href: '/' },
    { title: 'Rezepte', href: '/recipes' },
    { title: 'Zutaten', href: '/ingredients' },
  ];

  let mobileNav: Modal;
</script>

<header>
  <nav>
    <div
      class="flex items-center justify-between bg-primary-400 p-5 dark:bg-primary-500"
    >
      <a class="text-3xl font-bold" href="/">CocktailCalc</a>

      <!-- desktop view -->
      <ul class="hidden items-center space-x-5 text-xl font-semibold sm:flex">
        {#each pages as page (page.href)}
          <li class="list-item">
            <a href={page.href}>{page.title}</a>
          </li>
        {/each}
        <li>
          <DataSetting />
        </li>
        <li>
          <ThemeSetting />
        </li>
      </ul>

      <!-- mobile view -->
      <button
        class="block rounded-md p-1 hover:bg-primary-300 sm:hidden dark:hover:bg-primary-600"
        aria-label="Open menu"
        onclick={() => mobileNav.show()}
      >
        <Icon icon={Bars3} class="w-8 text-secondary-900 dark:text-white" />
      </button>
      <Modal bind:this={mobileNav} hideClose placeTop>
        <div class="flex flex-row-reverse items-center justify-between">
          <button
            aria-label="Close menu"
            class="-m-1 p-1"
            onclick={() => mobileNav.hide()}
          >
            <Icon
              icon={XMark}
              class="h-6 w-6 text-secondary-500 dark:text-secondary-400"
            />
          </button>
          <h2
            class="text-sm font-medium text-secondary-600 dark:text-secondary-400"
          >
            Navigation
          </h2>
        </div>
        <nav class="mt-6">
          <ul
            class="-my-2 divide-y divide-secondary-100 text-base text-secondary-800 dark:divide-secondary-100/5 dark:text-secondary-300"
          >
            {#each pages as page (page.href)}
              <li>
                <a
                  class="block p-2 hover:bg-secondary-200 dark:hover:bg-secondary-800"
                  href={page.href}
                  onclick={() => mobileNav.hide()}
                >
                  {page.title}
                </a>
              </li>
            {/each}
          </ul>
          <div class="mt-5 flex justify-end">
            <ThemeSetting
              class="rounded-md bg-primary-200 dark:bg-primary-600"
            />
          </div>
        </nav>
      </Modal>
    </div>
    <div class="h-1 bg-primary-500 px-1 dark:bg-primary-400"></div>
  </nav>
</header>
