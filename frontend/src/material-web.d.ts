import * as React from 'react';

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                    type?: 'button' | 'submit' | 'reset';
                    href?: string;
                    target?: string;
                    trailingIcon?: boolean;
                    hasIcon?: boolean;
                };
                'md-elevated-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                    type?: 'button' | 'submit' | 'reset';
                    href?: string;
                    target?: string;
                    trailingIcon?: boolean;
                    hasIcon?: boolean;
                };
                'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                    type?: 'button' | 'submit' | 'reset';
                    href?: string;
                    target?: string;
                    trailingIcon?: boolean;
                    hasIcon?: boolean;
                };
                'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                    type?: 'button' | 'submit' | 'reset';
                    href?: string;
                    target?: string;
                    trailingIcon?: boolean;
                    hasIcon?: boolean;
                };
                'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                    type?: 'button' | 'submit' | 'reset';
                    href?: string;
                    target?: string;
                    trailingIcon?: boolean;
                    hasIcon?: boolean;
                };
                'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                    type?: 'button' | 'submit' | 'reset';
                    href?: string;
                    target?: string;
                    selected?: boolean;
                    toggle?: boolean;
                };
                'md-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
                    size?: 'medium' | 'small' | 'large';
                    label?: string;
                    lowered?: boolean;
                    disabled?: boolean;
                };
                'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    slot?: string;
                };
                'md-ripple': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    disabled?: boolean;
                };
                'md-elevation': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    level?: '0' | '1' | '2' | '3' | '4' | '5' | 0 | 1 | 2 | 3 | 4 | 5;
                };
                'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    label?: string;
                    value?: string | number;
                    placeholder?: string;
                    disabled?: boolean;
                    error?: boolean;
                    errorText?: string;
                    supportingText?: string;
                    type?: string;
                    prefixText?: string;
                    suffixText?: string;
                    required?: boolean;
                    readOnly?: boolean;
                    name?: string;
                    step?: string | number;
                    min?: string | number;
                    max?: string | number;
                };
                'md-filled-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    label?: string;
                    value?: string | number;
                    placeholder?: string;
                    disabled?: boolean;
                    error?: boolean;
                    errorText?: string;
                    supportingText?: string;
                    type?: string;
                    prefixText?: string;
                    suffixText?: string;
                    required?: boolean;
                    readOnly?: boolean;
                    name?: string;
                    step?: string | number;
                    min?: string | number;
                    max?: string | number;
                };
                'md-navigation-bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    activeIndex?: number;
                    hideInactiveLabels?: boolean;
                };
                'md-navigation-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    label?: string;
                    active?: boolean;
                    badgeValue?: string;
                    showBadge?: boolean;
                };
                'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    value?: number;
                    max?: number;
                    buffer?: number;
                    indeterminate?: boolean;
                    fourColor?: boolean;
                };
                'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    value?: number;
                    max?: number;
                    indeterminate?: boolean;
                    fourColor?: boolean;
                };
                'md-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    checked?: boolean;
                    indeterminate?: boolean;
                    disabled?: boolean;
                    required?: boolean;
                    value?: string;
                    name?: string;
                };
                'md-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    selected?: boolean;
                    disabled?: boolean;
                    required?: boolean;
                    value?: string;
                    name?: string;
                    icons?: boolean;
                    showOnlySelectedIcon?: boolean;
                };
                'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    open?: boolean;
                    quick?: boolean;
                    type?: 'alert' | 'confirm';
                    returnValue?: string;
                };
                'md-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    inset?: boolean;
                    insetStart?: boolean;
                    insetEnd?: boolean;
                };
            }
        }
    }
}

export {};
