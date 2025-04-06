import type { Component, Snippet } from 'svelte';

type MODAL_SIZES = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ModalProperties {
  visible: boolean;
  title: string;
  size?: MODAL_SIZES | number;
  description?: string;
  children?: Component | null;
  childrenProps?: Record<string, any>;
}

interface ModalState {
  open: (props: Omit<ModalProperties, 'visible'>) => void;
  close: () => void;
}

export const modal = $state<ModalProperties & ModalState>({
  visible: false,
  title: '',
  description: '',
  children: null,

  open(props) {
    this.visible = true;
    this.title = props.title;
    this.description = props.description;
    this.children = props.children;
    this.childrenProps = props.childrenProps;
  },

  close() {
    this.visible = false;
  },
});
