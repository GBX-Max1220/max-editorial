/**
 * VENDORED from doocs/md (trimmed).
 * Upstream: https://github.com/doocs/md
 * Commit:   4699016755d0a699197aa6d634ed87f5a693b649
 * Source:   packages/core/src/types/marked-tokens.ts
 * License:  WTFPL v2
 * Modifications: kept only the alert token shapes used by the vendored alert.ts;
 *   dropped mermaid / plantuml / infographic / katex / ruby / markup token types
 *   (those extensions are out of scope per the migration decision).
 */

import type { RendererExtensionFunction, RendererThis, Token, Tokens } from 'marked'

export interface AlertMeta {
  className: string
  variant: string
  icon: string
  title: string
  titleClassName: string
  fromContainer: boolean
}

export interface AlertToken extends Tokens.Generic {
  type: 'alert'
  text: string
  tokens?: Token[]
  meta: AlertMeta
}

export type AlertRendererThis = RendererThis
export type AlertRendererFn = (this: AlertRendererThis, token: AlertToken) => string

/** Adapt a typed alert renderer (uses `this.parser`) to marked's signature. */
export function asAlertRenderer(fn: AlertRendererFn): RendererExtensionFunction {
  return function (this: AlertRendererThis, token: Tokens.Generic) {
    return fn.call(this, token as AlertToken)
  }
}
