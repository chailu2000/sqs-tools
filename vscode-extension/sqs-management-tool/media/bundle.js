var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
(function() {
  "use strict";
  var _commit_callbacks, _discard_callbacks, _pending, _blocking_pending, _deferred, _dirty_effects, _maybe_dirty_effects, _skipped_branches, _decrement_queued, _Batch_instances, is_deferred_fn, traverse_effect_tree_fn, defer_effects_fn, commit_fn, _anchor, _hydrate_open, _props, _children, _effect, _main_effect, _pending_effect, _failed_effect, _offscreen_fragment, _local_pending_count, _pending_count, _pending_count_update_queued, _dirty_effects2, _maybe_dirty_effects2, _effect_pending, _effect_pending_subscriber, _Boundary_instances, hydrate_resolved_content_fn, hydrate_failed_content_fn, hydrate_pending_content_fn, render_fn, resolve_fn, run_fn, update_pending_count_fn, _batches, _onscreen, _offscreen, _outroing, _transition, _commit, _discard, _a, _selectedQueue, _messages, _dlqMessages, _searchTerm, _viewMode, _activeTab, _selectedMessageIds, _loading, _error, _filteredMessages, _hasDLQ;
  var __vite_style__ = document.createElement("style");
  __vite_style__.textContent = '\n    .queue-details.svelte-1j1skn0 {\n        background: var(--vscode-editor-background);\n        border-radius: 8px;\n        padding: 1.5rem;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n    }\n\n    .header.svelte-1j1skn0 {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        margin-bottom: 1.5rem;\n        padding-bottom: 1rem;\n        border-bottom: 2px solid var(--vscode-panel-border);\n    }\n\n    .header-actions.svelte-1j1skn0 {\n        display: flex;\n        gap: 0.5rem;\n    }\n\n    h2.svelte-1j1skn0 {\n        margin: 0;\n        font-size: 1.5rem;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .btn-secondary.svelte-1j1skn0 {\n        background: var(--vscode-button-secondaryBackground);\n        color: var(--vscode-button-secondaryForeground);\n        border: none;\n        padding: 0.5rem 1rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.9rem;\n    }\n\n    .btn-secondary.svelte-1j1skn0:hover:not(:disabled) {\n        background: var(--vscode-button-secondaryHoverBackground);\n    }\n\n    .btn-secondary.svelte-1j1skn0:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .btn-danger.svelte-1j1skn0 {\n        background: var(--vscode-errorForeground);\n        color: var(--vscode-editor-background);\n        border: none;\n        padding: 0.5rem 1rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.9rem;\n    }\n\n    .btn-danger.svelte-1j1skn0:hover:not(:disabled) {\n        opacity: 0.9;\n    }\n\n    .btn-danger.svelte-1j1skn0:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .details-grid.svelte-1j1skn0 {\n        display: grid;\n        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n        gap: 1rem;\n    }\n\n    .detail-item.svelte-1j1skn0 {\n        display: flex;\n        flex-direction: column;\n        gap: 0.25rem;\n        padding: 0.75rem;\n        background: var(--vscode-editorGroupHeader-tabsBackground);\n        border-radius: 4px;\n    }\n\n    .detail-item.dlq.svelte-1j1skn0 {\n        background: var(--vscode-inputValidation-warningBackground);\n        border-left: 4px solid var(--vscode-inputValidation-warningBorder);\n    }\n\n    .label.svelte-1j1skn0 {\n        font-size: 0.85rem;\n        color: var(--vscode-descriptionForeground);\n        font-weight: 600;\n    }\n\n    .value.svelte-1j1skn0 {\n        font-size: 0.95rem;\n        color: var(--vscode-editor-foreground);\n        word-break: break-all;\n    }\n\n    .info-box.svelte-1j1skn0 {\n        margin-top: 1.5rem;\n        padding: 1rem;\n        background: var(--vscode-textBlockQuote-background);\n        border-left: 4px solid var(--vscode-textLink-foreground);\n        border-radius: 4px;\n    }\n\n    .info-box.svelte-1j1skn0 strong:where(.svelte-1j1skn0) {\n        color: var(--vscode-textLink-foreground);\n        display: block;\n        margin-bottom: 0.5rem;\n    }\n\n    .info-box.svelte-1j1skn0 p:where(.svelte-1j1skn0) {\n        margin: 0;\n        font-size: 0.9rem;\n        color: var(--vscode-editor-foreground);\n        line-height: 1.6;\n    }\n\n    .error.svelte-1j1skn0 {\n        margin-top: 1rem;\n        padding: 0.75rem;\n        background: var(--vscode-inputValidation-errorBackground);\n        color: var(--vscode-errorForeground);\n        border-radius: 4px;\n        border-left: 4px solid var(--vscode-errorForeground);\n    }\n\n    .success.svelte-1j1skn0 {\n        margin-top: 1rem;\n        padding: 0.75rem;\n        background: var(--vscode-textBlockQuote-background);\n        color: var(--vscode-textLink-foreground);\n        border-radius: 4px;\n        border-left: 4px solid var(--vscode-textLink-foreground);\n    }\n\n    .confirm-dialog.svelte-1j1skn0 {\n        background: var(--vscode-inputValidation-warningBackground);\n        border-left: 4px solid var(--vscode-inputValidation-warningBorder);\n        padding: 1rem;\n        border-radius: 4px;\n        margin-bottom: 1rem;\n    }\n\n    .confirm-content.svelte-1j1skn0 p:where(.svelte-1j1skn0) {\n        margin: 0 0 1rem 0;\n        color: var(--vscode-editor-foreground);\n        font-weight: 600;\n    }\n\n    .confirm-actions.svelte-1j1skn0 {\n        display: flex;\n        gap: 0.5rem;\n    }\n\n    .btn-secondary-action.svelte-1j1skn0 {\n        background: var(--vscode-button-secondaryBackground);\n        color: var(--vscode-button-secondaryForeground);\n        border: none;\n        padding: 0.5rem 1rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.9rem;\n    }\n\n    .btn-secondary-action.svelte-1j1skn0:hover:not(:disabled) {\n        background: var(--vscode-button-secondaryHoverBackground);\n    }\n\n    .btn-secondary-action.svelte-1j1skn0:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .message-composer.svelte-5a3nm6 {\n        background: var(--vscode-editor-background);\n        border-radius: 8px;\n        padding: 1.5rem;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n    }\n\n    h3.svelte-5a3nm6 {\n        margin: 0 0 1rem 0;\n        font-size: 1.25rem;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .form-group.svelte-5a3nm6 {\n        margin-bottom: 1rem;\n    }\n\n    label.svelte-5a3nm6 {\n        display: block;\n        margin-bottom: 0.5rem;\n        font-size: 0.9rem;\n        color: var(--vscode-descriptionForeground);\n        font-weight: 600;\n    }\n\n    .textarea.svelte-5a3nm6 {\n        width: 100%;\n        padding: 0.75rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n        font-family: "Courier New", monospace;\n        resize: vertical;\n    }\n\n    .form-row.svelte-5a3nm6 {\n        display: flex;\n        gap: 2rem;\n        align-items: center;\n        margin-bottom: 1rem;\n    }\n\n    .checkbox-label.svelte-5a3nm6 {\n        display: flex;\n        align-items: center;\n        gap: 0.5rem;\n        font-weight: normal;\n        cursor: pointer;\n    }\n\n    .checkbox-label.svelte-5a3nm6 input[type="checkbox"]:where(.svelte-5a3nm6) {\n        cursor: pointer;\n    }\n\n    .input-small.svelte-5a3nm6 {\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n        width: 120px;\n    }\n\n    .attributes-section.svelte-5a3nm6 {\n        margin-bottom: 1rem;\n        padding: 1rem;\n        background: var(--vscode-editorGroupHeader-tabsBackground);\n        border-radius: 4px;\n    }\n\n    .attributes-header.svelte-5a3nm6 {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        margin-bottom: 0.75rem;\n    }\n\n    .btn-small.svelte-5a3nm6 {\n        background: var(--vscode-button-background);\n        color: var(--vscode-button-foreground);\n        border: none;\n        padding: 0.25rem 0.75rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.85rem;\n    }\n\n    .btn-small.svelte-5a3nm6:hover {\n        background: var(--vscode-button-hoverBackground);\n    }\n\n    .attributes-list.svelte-5a3nm6 {\n        display: flex;\n        flex-direction: column;\n        gap: 0.5rem;\n    }\n\n    .attribute-row.svelte-5a3nm6 {\n        display: flex;\n        gap: 0.5rem;\n        align-items: center;\n    }\n\n    .input-attr-key.svelte-5a3nm6 {\n        flex: 1;\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n    }\n\n    .input-attr-type.svelte-5a3nm6 {\n        flex: 0 0 140px;\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n        cursor: pointer;\n    }\n\n    .input-attr-value.svelte-5a3nm6 {\n        flex: 2;\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n    }\n\n    .btn-remove-attr.svelte-5a3nm6 {\n        background: var(--vscode-errorForeground);\n        color: var(--vscode-editor-background);\n        border: none;\n        width: 32px;\n        height: 32px;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 1.2rem;\n        line-height: 1;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n    }\n\n    .btn-remove-attr.svelte-5a3nm6:hover {\n        opacity: 0.9;\n    }\n\n    .error.svelte-5a3nm6 {\n        padding: 0.75rem;\n        background: var(--vscode-inputValidation-errorBackground);\n        color: var(--vscode-errorForeground);\n        border-radius: 4px;\n        border-left: 4px solid var(--vscode-errorForeground);\n        margin-bottom: 1rem;\n    }\n\n    .success.svelte-5a3nm6 {\n        padding: 0.75rem;\n        background: var(--vscode-textBlockQuote-background);\n        color: var(--vscode-textLink-foreground);\n        border-radius: 4px;\n        border-left: 4px solid var(--vscode-textLink-foreground);\n        margin-bottom: 1rem;\n    }\n\n    .btn-primary.svelte-5a3nm6 {\n        background: var(--vscode-button-background);\n        color: var(--vscode-button-foreground);\n        border: none;\n        padding: 0.75rem 1.5rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 1rem;\n        width: 100%;\n    }\n\n    .btn-primary.svelte-5a3nm6:hover:not(:disabled) {\n        background: var(--vscode-button-hoverBackground);\n    }\n\n    .btn-primary.svelte-5a3nm6:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .fifo-section.svelte-5a3nm6 {\n        margin-bottom: 1rem;\n        padding: 1rem;\n        background: var(--vscode-editorGroupHeader-tabsBackground);\n        border-radius: 4px;\n        border-left: 3px solid var(--vscode-textLink-foreground);\n    }\n\n    .fifo-header.svelte-5a3nm6 {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        margin-bottom: 1rem;\n    }\n\n    .fifo-badge.svelte-5a3nm6 {\n        background: var(--vscode-textLink-foreground);\n        color: var(--vscode-editor-background);\n        padding: 0.25rem 0.5rem;\n        border-radius: 4px;\n        font-size: 0.75rem;\n        font-weight: bold;\n    }\n\n    .input-text.svelte-5a3nm6 {\n        width: 100%;\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n    }\n\n    .help-text.svelte-5a3nm6 {\n        display: block;\n        margin-top: 0.25rem;\n        font-size: 0.8rem;\n        color: var(--vscode-descriptionForeground);\n        font-style: italic;\n    }\n\n    .info-message.svelte-5a3nm6 {\n        padding: 0.75rem;\n        background: var(--vscode-textBlockQuote-background);\n        border-radius: 4px;\n        border-left: 3px solid var(--vscode-textLink-foreground);\n    }\n\n    .info-message.svelte-5a3nm6 strong:where(.svelte-5a3nm6) {\n        display: block;\n        margin-bottom: 0.5rem;\n        color: var(--vscode-textLink-foreground);\n    }\n\n    .info-message.svelte-5a3nm6 p:where(.svelte-5a3nm6) {\n        margin: 0;\n        font-size: 0.85rem;\n        color: var(--vscode-descriptionForeground);\n    }\n\n    .required.svelte-5a3nm6 {\n        color: var(--vscode-errorForeground);\n        font-weight: bold;\n    }\n\n    .optional.svelte-5a3nm6 {\n        color: var(--vscode-descriptionForeground);\n        font-size: 0.85rem;\n        font-weight: normal;\n    }\n\n    .message-table.svelte-ih63xe {\n        display: flex;\n        flex-direction: column;\n        gap: 1rem;\n        margin: 0;\n        padding: 0;\n    }\n\n    .tabs-container.svelte-ih63xe {\n        position: sticky;\n        top: -20px;\n        z-index: 100;\n        background: var(--vscode-editor-background);\n        border-radius: 0;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n        padding: 0.5rem 0;\n        margin: -20px -20px 0 -20px;\n        padding-left: 20px;\n        padding-right: 20px;\n    }\n\n    .tabs.svelte-ih63xe {\n        display: flex;\n        gap: 0.5rem;\n    }\n\n    .tabs.svelte-ih63xe button:where(.svelte-ih63xe) {\n        padding: 0.75rem 1.5rem;\n        border: 1px solid var(--vscode-panel-border);\n        background: var(--vscode-button-secondaryBackground);\n        color: var(--vscode-button-secondaryForeground);\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.95rem;\n        transition: all 0.2s;\n    }\n\n    .tabs.svelte-ih63xe button.active:where(.svelte-ih63xe) {\n        background: var(--vscode-button-background);\n        color: var(--vscode-button-foreground);\n        border-color: var(--vscode-button-background);\n    }\n\n    .tabs.svelte-ih63xe button:where(.svelte-ih63xe):disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .tabs.svelte-ih63xe button:where(.svelte-ih63xe):hover:not(:disabled):not(.active) {\n        background: var(--vscode-button-secondaryHoverBackground);\n    }\n\n    .controls.svelte-ih63xe {\n        background: var(--vscode-editor-background);\n        padding: 1rem;\n        border-radius: 8px;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        flex-wrap: wrap;\n        gap: 1rem;\n    }\n\n    .control-group.svelte-ih63xe {\n        display: flex;\n        gap: 1rem;\n        align-items: flex-end;\n    }\n\n    .message-count.svelte-ih63xe {\n        font-size: 0.9rem;\n        color: var(--vscode-descriptionForeground);\n        font-weight: 500;\n    }\n\n    .info-banner.svelte-ih63xe {\n        background: var(--vscode-textBlockQuote-background);\n        border-left: 4px solid var(--vscode-textLink-foreground);\n        padding: 0.75rem 1rem;\n        border-radius: 4px;\n        font-size: 0.9rem;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .info-banner.svelte-ih63xe strong:where(.svelte-ih63xe) {\n        color: var(--vscode-editor-foreground);\n        font-weight: 600;\n    }\n\n    .progress-container.svelte-ih63xe {\n        position: sticky;\n        top: 50px;\n        z-index: 99;\n        background: var(--vscode-editor-background);\n        padding: 1rem;\n        border-radius: 8px;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n    }\n\n    .progress-bar.svelte-ih63xe {\n        width: 100%;\n        height: 24px;\n        background: var(--vscode-input-background);\n        border: 1px solid var(--vscode-panel-border);\n        border-radius: 12px;\n        overflow: hidden;\n        margin-bottom: 0.5rem;\n    }\n\n    .progress-fill.svelte-ih63xe {\n        height: 100%;\n        background: var(--vscode-progressBar-background);\n        transition: width 0.3s ease;\n        border-radius: 12px;\n    }\n\n    .progress-text.svelte-ih63xe {\n        text-align: center;\n        font-size: 0.9rem;\n        color: var(--vscode-descriptionForeground);\n        font-weight: 500;\n    }\n\n    label.svelte-ih63xe {\n        display: flex;\n        flex-direction: column;\n        gap: 0.25rem;\n        font-size: 0.9rem;\n        color: var(--vscode-descriptionForeground);\n    }\n\n    .input-small.svelte-ih63xe {\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n        font-size: 0.9rem;\n        width: 100px;\n    }\n\n    .btn-primary.svelte-ih63xe,\n    .btn-danger.svelte-ih63xe,\n    .btn-secondary.svelte-ih63xe {\n        border: none;\n        padding: 0.5rem 1rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.9rem;\n    }\n\n    .btn-primary.svelte-ih63xe {\n        background: var(--vscode-button-background);\n        color: var(--vscode-button-foreground);\n    }\n\n    .btn-primary.svelte-ih63xe:hover:not(:disabled) {\n        background: var(--vscode-button-hoverBackground);\n    }\n\n    .btn-danger.svelte-ih63xe {\n        background: var(--vscode-errorForeground);\n        color: var(--vscode-editor-background);\n    }\n\n    .btn-danger.svelte-ih63xe:hover {\n        opacity: 0.9;\n    }\n\n    .btn-secondary.svelte-ih63xe {\n        background: var(--vscode-button-secondaryBackground);\n        color: var(--vscode-button-secondaryForeground);\n    }\n\n    .btn-secondary.svelte-ih63xe:hover {\n        background: var(--vscode-button-secondaryHoverBackground);\n    }\n\n    .btn-primary.svelte-ih63xe:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .error.svelte-ih63xe {\n        padding: 0.75rem;\n        background: var(--vscode-inputValidation-errorBackground);\n        color: var(--vscode-errorForeground);\n        border-radius: 4px;\n        border-left: 4px solid var(--vscode-errorForeground);\n    }\n\n    .success.svelte-ih63xe {\n        padding: 0.75rem;\n        background: var(--vscode-textBlockQuote-background);\n        color: var(--vscode-textLink-foreground);\n        border-radius: 4px;\n        border-left: 4px solid var(--vscode-textLink-foreground);\n    }\n\n    .confirm-dialog.svelte-ih63xe {\n        background: var(--vscode-inputValidation-warningBackground);\n        border-left: 4px solid var(--vscode-inputValidation-warningBorder);\n        padding: 1rem;\n        border-radius: 4px;\n    }\n\n    .confirm-content.svelte-ih63xe p:where(.svelte-ih63xe) {\n        margin: 0 0 1rem 0;\n        color: var(--vscode-editor-foreground);\n        font-weight: 600;\n    }\n\n    .confirm-actions.svelte-ih63xe {\n        display: flex;\n        gap: 0.5rem;\n    }\n\n    .btn-secondary-action.svelte-ih63xe {\n        background: var(--vscode-button-secondaryBackground);\n        color: var(--vscode-button-secondaryForeground);\n        border: none;\n        padding: 0.5rem 1rem;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 0.9rem;\n    }\n\n    .btn-secondary-action.svelte-ih63xe:hover:not(:disabled) {\n        background: var(--vscode-button-secondaryHoverBackground);\n    }\n\n    .btn-secondary-action.svelte-ih63xe:disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .bulk-actions.svelte-ih63xe {\n        background: var(--vscode-textBlockQuote-background);\n        padding: 0.75rem 1rem;\n        border-radius: 4px;\n        display: flex;\n        gap: 1rem;\n        align-items: center;\n    }\n\n    .bulk-actions.svelte-ih63xe span:where(.svelte-ih63xe) {\n        font-weight: 600;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .table-container.svelte-ih63xe {\n        background: var(--vscode-editor-background);\n        border-radius: 8px;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n        overflow: hidden;\n    }\n\n    table.svelte-ih63xe {\n        width: 100%;\n        border-collapse: collapse;\n    }\n\n    thead.svelte-ih63xe {\n        background: var(--vscode-editorGroupHeader-tabsBackground);\n        border-bottom: 2px solid var(--vscode-panel-border);\n    }\n\n    th.svelte-ih63xe {\n        padding: 0.75rem;\n        text-align: left;\n        font-weight: 600;\n        font-size: 0.9rem;\n        color: var(--vscode-descriptionForeground);\n    }\n\n    tbody.svelte-ih63xe tr:where(.svelte-ih63xe) {\n        border-bottom: 1px solid var(--vscode-panel-border);\n        cursor: pointer;\n        transition: background 0.2s;\n    }\n\n    tbody.svelte-ih63xe tr:where(.svelte-ih63xe):hover {\n        background: var(--vscode-list-hoverBackground);\n    }\n\n    tbody.svelte-ih63xe tr.selected:where(.svelte-ih63xe) {\n        background: var(--vscode-list-activeSelectionBackground);\n    }\n\n    td.svelte-ih63xe {\n        padding: 0.75rem;\n        font-size: 0.9rem;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .message-id.svelte-ih63xe {\n        font-family: monospace;\n        color: var(--vscode-descriptionForeground);\n    }\n\n    .body-preview.svelte-ih63xe {\n        color: var(--vscode-editor-foreground);\n    }\n\n    .receive-count.svelte-ih63xe {\n        font-weight: 600;\n        text-align: center;\n    }\n\n    .empty.svelte-ih63xe {\n        text-align: center;\n        padding: 3rem;\n        color: var(--vscode-descriptionForeground);\n    }\n\n    .checkbox-label.svelte-ih63xe {\n        display: flex;\n        align-items: center;\n        gap: 0.5rem;\n        cursor: pointer;\n        font-size: 0.9rem;\n        user-select: none;\n    }\n\n    .checkbox-label.svelte-ih63xe input:where(.svelte-ih63xe) {\n        width: 1.2rem;\n        height: 1.2rem;\n        cursor: pointer;\n    }\n\n    .pagination.svelte-ih63xe {\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        gap: 1rem;\n        padding: 1rem;\n        background: var(--vscode-editor-background);\n        border-radius: 8px;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n    }\n\n    .pagination.svelte-ih63xe button:where(.svelte-ih63xe) {\n        padding: 0.5rem 1rem;\n        border: 1px solid var(--vscode-panel-border);\n        background: var(--vscode-button-secondaryBackground);\n        color: var(--vscode-button-secondaryForeground);\n        border-radius: 4px;\n        cursor: pointer;\n    }\n\n    .pagination.svelte-ih63xe button:where(.svelte-ih63xe):hover:not(:disabled) {\n        background: var(--vscode-button-secondaryHoverBackground);\n    }\n\n    .pagination.svelte-ih63xe button:where(.svelte-ih63xe):disabled {\n        opacity: 0.5;\n        cursor: not-allowed;\n    }\n\n    .pagination.svelte-ih63xe select:where(.svelte-ih63xe) {\n        padding: 0.5rem;\n        border: 1px solid var(--vscode-input-border);\n        background: var(--vscode-input-background);\n        color: var(--vscode-input-foreground);\n        border-radius: 4px;\n    }\n\n    .message-details.svelte-ih63xe {\n        background: var(--vscode-editor-background);\n        border-radius: 8px;\n        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n        padding: 1rem;\n    }\n\n    .details-header.svelte-ih63xe {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        margin-bottom: 1rem;\n        padding-bottom: 1rem;\n        border-bottom: 2px solid var(--vscode-panel-border);\n    }\n\n    .details-header.svelte-ih63xe h3:where(.svelte-ih63xe) {\n        margin: 0;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .btn-close.svelte-ih63xe {\n        background: var(--vscode-errorForeground);\n        color: var(--vscode-editor-background);\n        border: none;\n        width: 32px;\n        height: 32px;\n        border-radius: 50%;\n        cursor: pointer;\n        font-size: 1.5rem;\n        line-height: 1;\n    }\n\n    .btn-close.svelte-ih63xe:hover {\n        opacity: 0.9;\n    }\n\n    .details-content.svelte-ih63xe {\n        display: flex;\n        flex-direction: column;\n        gap: 1rem;\n    }\n\n    .detail-row.svelte-ih63xe {\n        display: flex;\n        flex-direction: column;\n        gap: 0.5rem;\n    }\n\n    .detail-row.svelte-ih63xe strong:where(.svelte-ih63xe) {\n        color: var(--vscode-descriptionForeground);\n        font-size: 0.9rem;\n    }\n\n    .monospace.svelte-ih63xe {\n        font-family: monospace;\n        font-size: 0.85rem;\n        color: var(--vscode-editor-foreground);\n        word-break: break-all;\n    }\n\n    .attributes.svelte-ih63xe {\n        display: flex;\n        flex-wrap: wrap;\n        gap: 0.5rem;\n    }\n\n    .attribute.svelte-ih63xe {\n        background: var(--vscode-editorGroupHeader-tabsBackground);\n        padding: 0.25rem 0.5rem;\n        border-radius: 4px;\n        font-size: 0.85rem;\n    }\n\n    .attr-key.svelte-ih63xe {\n        color: var(--vscode-descriptionForeground);\n        font-weight: 600;\n    }\n\n    .attr-value.svelte-ih63xe {\n        color: var(--vscode-editor-foreground);\n        margin-left: 0.25rem;\n    }\n\n    .fifo-value.svelte-ih63xe {\n        font-family: monospace;\n        font-size: 0.9rem;\n        color: var(--vscode-textLink-foreground);\n        background: var(--vscode-editorGroupHeader-tabsBackground);\n        padding: 0.25rem 0.5rem;\n        border-radius: 4px;\n        display: inline-block;\n    }\n\n    .body-content.svelte-ih63xe {\n        background: var(--vscode-textCodeBlock-background);\n        padding: 1rem;\n        border-radius: 4px;\n        overflow-x: auto;\n        margin: 0;\n        font-family: monospace;\n        font-size: 0.85rem;\n        line-height: 1.5;\n        white-space: pre-wrap;\n        word-break: break-all;\n        color: var(--vscode-editor-foreground);\n    }\n\n    .message-actions.svelte-ih63xe {\n        display: flex;\n        gap: 0.5rem;\n    }\n\n    .btn-small.svelte-ih63xe {\n        padding: 0.25rem 0.5rem;\n        font-size: 0.85rem;\n        border: none;\n        border-radius: 4px;\n        cursor: pointer;\n    }\n\n    .btn-danger-small.svelte-ih63xe {\n        background: var(--vscode-errorForeground);\n        color: var(--vscode-editor-background);\n    }\n\n    .btn-danger-small.svelte-ih63xe:hover {\n        opacity: 0.9;\n    }\n\n    .poll-button.svelte-ih63xe {\n        font-weight: 600;\n    }\n\n    .stop-button.svelte-ih63xe {\n        font-weight: 600;\n    }\n\n    .app-extension.svelte-1cgheqj {\n        min-height: 100vh;\n        width: 100%;\n        background-color: var(--vscode-editor-background, #fff);\n        color: var(--vscode-editor-foreground, #000);\n        margin: 0;\n        padding: 20px;\n        box-sizing: border-box;\n    }\n\n    .placeholder.svelte-1cgheqj {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        height: 100vh;\n        color: var(--vscode-descriptionForeground, #999);\n        font-size: 1.1rem;\n    }\n\n    .toast.svelte-1cgheqj {\n        position: fixed;\n        bottom: 2rem;\n        right: 2rem;\n        background: var(--vscode-errorForeground, #f44336);\n        color: var(--vscode-editor-background, white);\n        padding: 1rem 1.5rem;\n        border-radius: 4px;\n        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);\n        display: flex;\n        align-items: center;\n        gap: 1rem;\n        max-width: 400px;\n        animation: svelte-1cgheqj-slideIn 0.3s ease-out;\n        z-index: 1000;\n    }\n\n    .toast.svelte-1cgheqj button:where(.svelte-1cgheqj) {\n        background: none;\n        border: none;\n        color: inherit;\n        font-size: 1.5rem;\n        cursor: pointer;\n        padding: 0;\n        line-height: 1;\n    }\n\n    @keyframes svelte-1cgheqj-slideIn {\n        from {\n            transform: translateX(100%);\n            opacity: 0;\n        }\n        to {\n            transform: translateX(0);\n            opacity: 1;\n        }\n    }\n/*$vite$:1*/';
  document.head.appendChild(__vite_style__);
  const DEV = false;
  var is_array = Array.isArray;
  var index_of = Array.prototype.indexOf;
  var includes = Array.prototype.includes;
  var array_from = Array.from;
  var define_property = Object.defineProperty;
  var get_descriptor = Object.getOwnPropertyDescriptor;
  var get_descriptors = Object.getOwnPropertyDescriptors;
  var object_prototype = Object.prototype;
  var array_prototype = Array.prototype;
  var get_prototype_of = Object.getPrototypeOf;
  var is_extensible = Object.isExtensible;
  const noop = () => {
  };
  function run(fn) {
    return fn();
  }
  function run_all(arr) {
    for (var i = 0; i < arr.length; i++) {
      arr[i]();
    }
  }
  function deferred() {
    var resolve;
    var reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
  function to_array(value, n) {
    if (Array.isArray(value)) {
      return value;
    }
    if (!(Symbol.iterator in value)) {
      return Array.from(value);
    }
    const array = [];
    for (const element of value) {
      array.push(element);
      if (array.length === n) break;
    }
    return array;
  }
  const DERIVED = 1 << 1;
  const EFFECT = 1 << 2;
  const RENDER_EFFECT = 1 << 3;
  const MANAGED_EFFECT = 1 << 24;
  const BLOCK_EFFECT = 1 << 4;
  const BRANCH_EFFECT = 1 << 5;
  const ROOT_EFFECT = 1 << 6;
  const BOUNDARY_EFFECT = 1 << 7;
  const CONNECTED = 1 << 9;
  const CLEAN = 1 << 10;
  const DIRTY = 1 << 11;
  const MAYBE_DIRTY = 1 << 12;
  const INERT = 1 << 13;
  const DESTROYED = 1 << 14;
  const REACTION_RAN = 1 << 15;
  const EFFECT_TRANSPARENT = 1 << 16;
  const EAGER_EFFECT = 1 << 17;
  const HEAD_EFFECT = 1 << 18;
  const EFFECT_PRESERVED = 1 << 19;
  const USER_EFFECT = 1 << 20;
  const EFFECT_OFFSCREEN = 1 << 25;
  const WAS_MARKED = 1 << 16;
  const REACTION_IS_UPDATING = 1 << 21;
  const ASYNC = 1 << 22;
  const ERROR_VALUE = 1 << 23;
  const STATE_SYMBOL = Symbol("$state");
  const LOADING_ATTR_SYMBOL = Symbol("");
  const STALE_REACTION = new class StaleReactionError extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "StaleReactionError");
      __publicField(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
    }
  }();
  function async_derived_orphan() {
    {
      throw new Error(`https://svelte.dev/e/async_derived_orphan`);
    }
  }
  function each_key_duplicate(a, b, value) {
    {
      throw new Error(`https://svelte.dev/e/each_key_duplicate`);
    }
  }
  function effect_in_teardown(rune) {
    {
      throw new Error(`https://svelte.dev/e/effect_in_teardown`);
    }
  }
  function effect_in_unowned_derived() {
    {
      throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
    }
  }
  function effect_orphan(rune) {
    {
      throw new Error(`https://svelte.dev/e/effect_orphan`);
    }
  }
  function effect_update_depth_exceeded() {
    {
      throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
    }
  }
  function state_descriptors_fixed() {
    {
      throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
    }
  }
  function state_prototype_fixed() {
    {
      throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
    }
  }
  function state_unsafe_mutation() {
    {
      throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
    }
  }
  function svelte_boundary_reset_onerror() {
    {
      throw new Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
    }
  }
  const EACH_ITEM_REACTIVE = 1;
  const EACH_INDEX_REACTIVE = 1 << 1;
  const EACH_ITEM_IMMUTABLE = 1 << 4;
  const TEMPLATE_FRAGMENT = 1;
  const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
  const UNINITIALIZED = Symbol();
  const NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
  function select_multiple_invalid_value() {
    {
      console.warn(`https://svelte.dev/e/select_multiple_invalid_value`);
    }
  }
  function svelte_boundary_reset_noop() {
    {
      console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
    }
  }
  function equals(value) {
    return value === this.v;
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
  }
  function safe_equals(value) {
    return !safe_not_equal(value, this.v);
  }
  let legacy_mode_flag = false;
  let tracing_mode_flag = false;
  function enable_legacy_mode_flag() {
    legacy_mode_flag = true;
  }
  let component_context = null;
  function set_component_context(context) {
    component_context = context;
  }
  function push(props, runes = false, fn) {
    component_context = {
      p: component_context,
      i: false,
      c: null,
      e: null,
      s: props,
      x: null,
      l: legacy_mode_flag && !runes ? { s: null, u: null, $: [] } : null
    };
  }
  function pop(component) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    var effects = context.e;
    if (effects !== null) {
      context.e = null;
      for (var fn of effects) {
        create_user_effect(fn);
      }
    }
    context.i = true;
    component_context = context.p;
    return (
      /** @type {T} */
      {}
    );
  }
  function is_runes() {
    return !legacy_mode_flag || component_context !== null && component_context.l === null;
  }
  let micro_tasks = [];
  function run_micro_tasks() {
    var tasks = micro_tasks;
    micro_tasks = [];
    run_all(tasks);
  }
  function queue_micro_task(fn) {
    if (micro_tasks.length === 0 && !is_flushing_sync) {
      var tasks = micro_tasks;
      queueMicrotask(() => {
        if (tasks === micro_tasks) run_micro_tasks();
      });
    }
    micro_tasks.push(fn);
  }
  function flush_tasks() {
    while (micro_tasks.length > 0) {
      run_micro_tasks();
    }
  }
  function handle_error(error) {
    var effect2 = active_effect;
    if (effect2 === null) {
      active_reaction.f |= ERROR_VALUE;
      return error;
    }
    if ((effect2.f & REACTION_RAN) === 0 && (effect2.f & EFFECT) === 0) {
      throw error;
    }
    invoke_error_boundary(error, effect2);
  }
  function invoke_error_boundary(error, effect2) {
    while (effect2 !== null) {
      if ((effect2.f & BOUNDARY_EFFECT) !== 0) {
        if ((effect2.f & REACTION_RAN) === 0) {
          throw error;
        }
        try {
          effect2.b.error(error);
          return;
        } catch (e) {
          error = e;
        }
      }
      effect2 = effect2.parent;
    }
    throw error;
  }
  const STATUS_MASK = -7169;
  function set_signal_status(signal, status) {
    signal.f = signal.f & STATUS_MASK | status;
  }
  function update_derived_status(derived2) {
    if ((derived2.f & CONNECTED) !== 0 || derived2.deps === null) {
      set_signal_status(derived2, CLEAN);
    } else {
      set_signal_status(derived2, MAYBE_DIRTY);
    }
  }
  function clear_marked(deps) {
    if (deps === null) return;
    for (const dep of deps) {
      if ((dep.f & DERIVED) === 0 || (dep.f & WAS_MARKED) === 0) {
        continue;
      }
      dep.f ^= WAS_MARKED;
      clear_marked(
        /** @type {Derived} */
        dep.deps
      );
    }
  }
  function defer_effect(effect2, dirty_effects, maybe_dirty_effects) {
    if ((effect2.f & DIRTY) !== 0) {
      dirty_effects.add(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      maybe_dirty_effects.add(effect2);
    }
    clear_marked(effect2.deps);
    set_signal_status(effect2, CLEAN);
  }
  const batches = /* @__PURE__ */ new Set();
  let current_batch = null;
  let previous_batch = null;
  let batch_values = null;
  let queued_root_effects = [];
  let last_scheduled_effect = null;
  let is_flushing = false;
  let is_flushing_sync = false;
  const _Batch = class _Batch {
    constructor() {
      __privateAdd(this, _Batch_instances);
      /**
       * The current values of any sources that are updated in this batch
       * They keys of this map are identical to `this.#previous`
       * @type {Map<Source, any>}
       */
      __publicField(this, "current", /* @__PURE__ */ new Map());
      /**
       * The values of any sources that are updated in this batch _before_ those updates took place.
       * They keys of this map are identical to `this.#current`
       * @type {Map<Source, any>}
       */
      __publicField(this, "previous", /* @__PURE__ */ new Map());
      /**
       * When the batch is committed (and the DOM is updated), we need to remove old branches
       * and append new ones by calling the functions added inside (if/each/key/etc) blocks
       * @type {Set<() => void>}
       */
      __privateAdd(this, _commit_callbacks, /* @__PURE__ */ new Set());
      /**
       * If a fork is discarded, we need to destroy any effects that are no longer needed
       * @type {Set<(batch: Batch) => void>}
       */
      __privateAdd(this, _discard_callbacks, /* @__PURE__ */ new Set());
      /**
       * The number of async effects that are currently in flight
       */
      __privateAdd(this, _pending, 0);
      /**
       * The number of async effects that are currently in flight, _not_ inside a pending boundary
       */
      __privateAdd(this, _blocking_pending, 0);
      /**
       * A deferred that resolves when the batch is committed, used with `settled()`
       * TODO replace with Promise.withResolvers once supported widely enough
       * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
       */
      __privateAdd(this, _deferred, null);
      /**
       * Deferred effects (which run after async work has completed) that are DIRTY
       * @type {Set<Effect>}
       */
      __privateAdd(this, _dirty_effects, /* @__PURE__ */ new Set());
      /**
       * Deferred effects that are MAYBE_DIRTY
       * @type {Set<Effect>}
       */
      __privateAdd(this, _maybe_dirty_effects, /* @__PURE__ */ new Set());
      /**
       * A map of branches that still exist, but will be destroyed when this batch
       * is committed — we skip over these during `process`.
       * The value contains child effects that were dirty/maybe_dirty before being reset,
       * so they can be rescheduled if the branch survives.
       * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
       */
      __privateAdd(this, _skipped_branches, /* @__PURE__ */ new Map());
      __publicField(this, "is_fork", false);
      __privateAdd(this, _decrement_queued, false);
    }
    /**
     * Add an effect to the #skipped_branches map and reset its children
     * @param {Effect} effect
     */
    skip_effect(effect2) {
      if (!__privateGet(this, _skipped_branches).has(effect2)) {
        __privateGet(this, _skipped_branches).set(effect2, { d: [], m: [] });
      }
    }
    /**
     * Remove an effect from the #skipped_branches map and reschedule
     * any tracked dirty/maybe_dirty child effects
     * @param {Effect} effect
     */
    unskip_effect(effect2) {
      var tracked = __privateGet(this, _skipped_branches).get(effect2);
      if (tracked) {
        __privateGet(this, _skipped_branches).delete(effect2);
        for (var e of tracked.d) {
          set_signal_status(e, DIRTY);
          schedule_effect(e);
        }
        for (e of tracked.m) {
          set_signal_status(e, MAYBE_DIRTY);
          schedule_effect(e);
        }
      }
    }
    /**
     *
     * @param {Effect[]} root_effects
     */
    process(root_effects) {
      queued_root_effects = [];
      this.apply();
      var effects = [];
      var render_effects = [];
      for (const root2 of root_effects) {
        __privateMethod(this, _Batch_instances, traverse_effect_tree_fn).call(this, root2, effects, render_effects);
      }
      if (__privateMethod(this, _Batch_instances, is_deferred_fn).call(this)) {
        __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, render_effects);
        __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, effects);
        for (const [e, t] of __privateGet(this, _skipped_branches)) {
          reset_branch(e, t);
        }
      } else {
        for (const fn of __privateGet(this, _commit_callbacks)) fn();
        __privateGet(this, _commit_callbacks).clear();
        if (__privateGet(this, _pending) === 0) {
          __privateMethod(this, _Batch_instances, commit_fn).call(this);
        }
        previous_batch = this;
        current_batch = null;
        flush_queued_effects(render_effects);
        flush_queued_effects(effects);
        previous_batch = null;
        __privateGet(this, _deferred)?.resolve();
      }
      batch_values = null;
    }
    /**
     * Associate a change to a given source with the current
     * batch, noting its previous and current values
     * @param {Source} source
     * @param {any} value
     */
    capture(source2, value) {
      if (value !== UNINITIALIZED && !this.previous.has(source2)) {
        this.previous.set(source2, value);
      }
      if ((source2.f & ERROR_VALUE) === 0) {
        this.current.set(source2, source2.v);
        batch_values?.set(source2, source2.v);
      }
    }
    activate() {
      current_batch = this;
      this.apply();
    }
    deactivate() {
      if (current_batch !== this) return;
      current_batch = null;
      batch_values = null;
    }
    flush() {
      this.activate();
      if (queued_root_effects.length > 0) {
        flush_effects();
        if (current_batch !== null && current_batch !== this) {
          return;
        }
      } else if (__privateGet(this, _pending) === 0) {
        this.process([]);
      }
      this.deactivate();
    }
    discard() {
      for (const fn of __privateGet(this, _discard_callbacks)) fn(this);
      __privateGet(this, _discard_callbacks).clear();
    }
    /**
     *
     * @param {boolean} blocking
     */
    increment(blocking) {
      __privateSet(this, _pending, __privateGet(this, _pending) + 1);
      if (blocking) __privateSet(this, _blocking_pending, __privateGet(this, _blocking_pending) + 1);
    }
    /**
     *
     * @param {boolean} blocking
     */
    decrement(blocking) {
      __privateSet(this, _pending, __privateGet(this, _pending) - 1);
      if (blocking) __privateSet(this, _blocking_pending, __privateGet(this, _blocking_pending) - 1);
      if (__privateGet(this, _decrement_queued)) return;
      __privateSet(this, _decrement_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _decrement_queued, false);
        if (!__privateMethod(this, _Batch_instances, is_deferred_fn).call(this)) {
          this.revive();
        } else if (queued_root_effects.length > 0) {
          this.flush();
        }
      });
    }
    revive() {
      for (const e of __privateGet(this, _dirty_effects)) {
        __privateGet(this, _maybe_dirty_effects).delete(e);
        set_signal_status(e, DIRTY);
        schedule_effect(e);
      }
      for (const e of __privateGet(this, _maybe_dirty_effects)) {
        set_signal_status(e, MAYBE_DIRTY);
        schedule_effect(e);
      }
      this.flush();
    }
    /** @param {() => void} fn */
    oncommit(fn) {
      __privateGet(this, _commit_callbacks).add(fn);
    }
    /** @param {(batch: Batch) => void} fn */
    ondiscard(fn) {
      __privateGet(this, _discard_callbacks).add(fn);
    }
    settled() {
      return (__privateGet(this, _deferred) ?? __privateSet(this, _deferred, deferred())).promise;
    }
    static ensure() {
      if (current_batch === null) {
        const batch = current_batch = new _Batch();
        batches.add(current_batch);
        if (!is_flushing_sync) {
          queue_micro_task(() => {
            if (current_batch !== batch) {
              return;
            }
            batch.flush();
          });
        }
      }
      return current_batch;
    }
    apply() {
      return;
    }
  };
  _commit_callbacks = new WeakMap();
  _discard_callbacks = new WeakMap();
  _pending = new WeakMap();
  _blocking_pending = new WeakMap();
  _deferred = new WeakMap();
  _dirty_effects = new WeakMap();
  _maybe_dirty_effects = new WeakMap();
  _skipped_branches = new WeakMap();
  _decrement_queued = new WeakMap();
  _Batch_instances = new WeakSet();
  is_deferred_fn = function() {
    return this.is_fork || __privateGet(this, _blocking_pending) > 0;
  };
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   * @param {Effect[]} effects
   * @param {Effect[]} render_effects
   */
  traverse_effect_tree_fn = function(root2, effects, render_effects) {
    root2.f ^= CLEAN;
    var effect2 = root2.first;
    while (effect2 !== null) {
      var flags2 = effect2.f;
      var is_branch = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags2 & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags2 & INERT) !== 0 || __privateGet(this, _skipped_branches).has(effect2);
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
        } else if ((flags2 & EFFECT) !== 0) {
          effects.push(effect2);
        } else if (is_dirty(effect2)) {
          if ((flags2 & BLOCK_EFFECT) !== 0) __privateGet(this, _maybe_dirty_effects).add(effect2);
          update_effect(effect2);
        }
        var child2 = effect2.first;
        if (child2 !== null) {
          effect2 = child2;
          continue;
        }
      }
      while (effect2 !== null) {
        var next = effect2.next;
        if (next !== null) {
          effect2 = next;
          break;
        }
        effect2 = effect2.parent;
      }
    }
  };
  /**
   * @param {Effect[]} effects
   */
  defer_effects_fn = function(effects) {
    for (var i = 0; i < effects.length; i += 1) {
      defer_effect(effects[i], __privateGet(this, _dirty_effects), __privateGet(this, _maybe_dirty_effects));
    }
  };
  commit_fn = function() {
    var _a2;
    if (batches.size > 1) {
      this.previous.clear();
      var previous_batch_values = batch_values;
      var is_earlier = true;
      for (const batch of batches) {
        if (batch === this) {
          is_earlier = false;
          continue;
        }
        const sources = [];
        for (const [source2, value] of this.current) {
          if (batch.current.has(source2)) {
            if (is_earlier && value !== batch.current.get(source2)) {
              batch.current.set(source2, value);
            } else {
              continue;
            }
          }
          sources.push(source2);
        }
        if (sources.length === 0) {
          continue;
        }
        const others = [...batch.current.keys()].filter((s) => !this.current.has(s));
        if (others.length > 0) {
          var prev_queued_root_effects = queued_root_effects;
          queued_root_effects = [];
          const marked = /* @__PURE__ */ new Set();
          const checked = /* @__PURE__ */ new Map();
          for (const source2 of sources) {
            mark_effects(source2, others, marked, checked);
          }
          if (queued_root_effects.length > 0) {
            current_batch = batch;
            batch.apply();
            for (const root2 of queued_root_effects) {
              __privateMethod(_a2 = batch, _Batch_instances, traverse_effect_tree_fn).call(_a2, root2, [], []);
            }
            batch.deactivate();
          }
          queued_root_effects = prev_queued_root_effects;
        }
      }
      current_batch = null;
      batch_values = previous_batch_values;
    }
    batches.delete(this);
  };
  let Batch = _Batch;
  function flushSync(fn) {
    var was_flushing_sync = is_flushing_sync;
    is_flushing_sync = true;
    try {
      var result;
      if (fn) ;
      while (true) {
        flush_tasks();
        if (queued_root_effects.length === 0) {
          current_batch?.flush();
          if (queued_root_effects.length === 0) {
            last_scheduled_effect = null;
            return (
              /** @type {T} */
              result
            );
          }
        }
        flush_effects();
      }
    } finally {
      is_flushing_sync = was_flushing_sync;
    }
  }
  function flush_effects() {
    is_flushing = true;
    var source_stacks = null;
    try {
      var flush_count = 0;
      while (queued_root_effects.length > 0) {
        var batch = Batch.ensure();
        if (flush_count++ > 1e3) {
          var updates, entry;
          if (DEV) ;
          infinite_loop_guard();
        }
        batch.process(queued_root_effects);
        old_values.clear();
        if (DEV) ;
      }
    } finally {
      queued_root_effects = [];
      is_flushing = false;
      last_scheduled_effect = null;
    }
  }
  function infinite_loop_guard() {
    try {
      effect_update_depth_exceeded();
    } catch (error) {
      invoke_error_boundary(error, last_scheduled_effect);
    }
  }
  let eager_block_effects = null;
  function flush_queued_effects(effects) {
    var length = effects.length;
    if (length === 0) return;
    var i = 0;
    while (i < length) {
      var effect2 = effects[i++];
      if ((effect2.f & (DESTROYED | INERT)) === 0 && is_dirty(effect2)) {
        eager_block_effects = /* @__PURE__ */ new Set();
        update_effect(effect2);
        if (effect2.deps === null && effect2.first === null && effect2.nodes === null && effect2.teardown === null && effect2.ac === null) {
          unlink_effect(effect2);
        }
        if (eager_block_effects?.size > 0) {
          old_values.clear();
          for (const e of eager_block_effects) {
            if ((e.f & (DESTROYED | INERT)) !== 0) continue;
            const ordered_effects = [e];
            let ancestor = e.parent;
            while (ancestor !== null) {
              if (eager_block_effects.has(ancestor)) {
                eager_block_effects.delete(ancestor);
                ordered_effects.push(ancestor);
              }
              ancestor = ancestor.parent;
            }
            for (let j = ordered_effects.length - 1; j >= 0; j--) {
              const e2 = ordered_effects[j];
              if ((e2.f & (DESTROYED | INERT)) !== 0) continue;
              update_effect(e2);
            }
          }
          eager_block_effects.clear();
        }
      }
    }
    eager_block_effects = null;
  }
  function mark_effects(value, sources, marked, checked) {
    if (marked.has(value)) return;
    marked.add(value);
    if (value.reactions !== null) {
      for (const reaction of value.reactions) {
        const flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark_effects(
            /** @type {Derived} */
            reaction,
            sources,
            marked,
            checked
          );
        } else if ((flags2 & (ASYNC | BLOCK_EFFECT)) !== 0 && (flags2 & DIRTY) === 0 && depends_on(reaction, sources, checked)) {
          set_signal_status(reaction, DIRTY);
          schedule_effect(
            /** @type {Effect} */
            reaction
          );
        }
      }
    }
  }
  function depends_on(reaction, sources, checked) {
    const depends = checked.get(reaction);
    if (depends !== void 0) return depends;
    if (reaction.deps !== null) {
      for (const dep of reaction.deps) {
        if (includes.call(sources, dep)) {
          return true;
        }
        if ((dep.f & DERIVED) !== 0 && depends_on(
          /** @type {Derived} */
          dep,
          sources,
          checked
        )) {
          checked.set(
            /** @type {Derived} */
            dep,
            true
          );
          return true;
        }
      }
    }
    checked.set(reaction, false);
    return false;
  }
  function schedule_effect(signal) {
    var effect2 = last_scheduled_effect = signal;
    var boundary2 = effect2.b;
    if (boundary2?.is_pending && (signal.f & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0 && (signal.f & REACTION_RAN) === 0) {
      boundary2.defer_effect(signal);
      return;
    }
    while (effect2.parent !== null) {
      effect2 = effect2.parent;
      var flags2 = effect2.f;
      if (is_flushing && effect2 === active_effect && (flags2 & BLOCK_EFFECT) !== 0 && (flags2 & HEAD_EFFECT) === 0 && (flags2 & REACTION_RAN) !== 0) {
        return;
      }
      if ((flags2 & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
        if ((flags2 & CLEAN) === 0) {
          return;
        }
        effect2.f ^= CLEAN;
      }
    }
    queued_root_effects.push(effect2);
  }
  function reset_branch(effect2, tracked) {
    if ((effect2.f & BRANCH_EFFECT) !== 0 && (effect2.f & CLEAN) !== 0) {
      return;
    }
    if ((effect2.f & DIRTY) !== 0) {
      tracked.d.push(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      tracked.m.push(effect2);
    }
    set_signal_status(effect2, CLEAN);
    var e = effect2.first;
    while (e !== null) {
      reset_branch(e, tracked);
      e = e.next;
    }
  }
  function createSubscriber(start) {
    let subscribers = 0;
    let version = source(0);
    let stop;
    return () => {
      if (effect_tracking()) {
        get(version);
        render_effect(() => {
          if (subscribers === 0) {
            stop = untrack(() => start(() => increment(version)));
          }
          subscribers += 1;
          return () => {
            queue_micro_task(() => {
              subscribers -= 1;
              if (subscribers === 0) {
                stop?.();
                stop = void 0;
                increment(version);
              }
            });
          };
        });
      }
    };
  }
  var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
  function boundary(node, props, children, transform_error) {
    new Boundary(node, props, children, transform_error);
  }
  class Boundary {
    /**
     * @param {TemplateNode} node
     * @param {BoundaryProps} props
     * @param {((anchor: Node) => void)} children
     * @param {((error: unknown) => unknown) | undefined} [transform_error]
     */
    constructor(node, props, children, transform_error) {
      __privateAdd(this, _Boundary_instances);
      /** @type {Boundary | null} */
      __publicField(this, "parent");
      __publicField(this, "is_pending", false);
      /**
       * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
       * Inherited from parent boundary, or defaults to identity.
       * @type {(error: unknown) => unknown}
       */
      __publicField(this, "transform_error");
      /** @type {TemplateNode} */
      __privateAdd(this, _anchor);
      /** @type {TemplateNode | null} */
      __privateAdd(this, _hydrate_open, null);
      /** @type {BoundaryProps} */
      __privateAdd(this, _props);
      /** @type {((anchor: Node) => void)} */
      __privateAdd(this, _children);
      /** @type {Effect} */
      __privateAdd(this, _effect);
      /** @type {Effect | null} */
      __privateAdd(this, _main_effect, null);
      /** @type {Effect | null} */
      __privateAdd(this, _pending_effect, null);
      /** @type {Effect | null} */
      __privateAdd(this, _failed_effect, null);
      /** @type {DocumentFragment | null} */
      __privateAdd(this, _offscreen_fragment, null);
      __privateAdd(this, _local_pending_count, 0);
      __privateAdd(this, _pending_count, 0);
      __privateAdd(this, _pending_count_update_queued, false);
      /** @type {Set<Effect>} */
      __privateAdd(this, _dirty_effects2, /* @__PURE__ */ new Set());
      /** @type {Set<Effect>} */
      __privateAdd(this, _maybe_dirty_effects2, /* @__PURE__ */ new Set());
      /**
       * A source containing the number of pending async deriveds/expressions.
       * Only created if `$effect.pending()` is used inside the boundary,
       * otherwise updating the source results in needless `Batch.ensure()`
       * calls followed by no-op flushes
       * @type {Source<number> | null}
       */
      __privateAdd(this, _effect_pending, null);
      __privateAdd(this, _effect_pending_subscriber, createSubscriber(() => {
        __privateSet(this, _effect_pending, source(__privateGet(this, _local_pending_count)));
        return () => {
          __privateSet(this, _effect_pending, null);
        };
      }));
      __privateSet(this, _anchor, node);
      __privateSet(this, _props, props);
      __privateSet(this, _children, (anchor) => {
        var effect2 = (
          /** @type {Effect} */
          active_effect
        );
        effect2.b = this;
        effect2.f |= BOUNDARY_EFFECT;
        children(anchor);
      });
      this.parent = /** @type {Effect} */
      active_effect.b;
      this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
      __privateSet(this, _effect, block(() => {
        {
          __privateMethod(this, _Boundary_instances, render_fn).call(this);
        }
      }, flags));
    }
    /**
     * Defer an effect inside a pending boundary until the boundary resolves
     * @param {Effect} effect
     */
    defer_effect(effect2) {
      defer_effect(effect2, __privateGet(this, _dirty_effects2), __privateGet(this, _maybe_dirty_effects2));
    }
    /**
     * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
     * @returns {boolean}
     */
    is_rendered() {
      return !this.is_pending && (!this.parent || this.parent.is_rendered());
    }
    has_pending_snippet() {
      return !!__privateGet(this, _props).pending;
    }
    /**
     * Update the source that powers `$effect.pending()` inside this boundary,
     * and controls when the current `pending` snippet (if any) is removed.
     * Do not call from inside the class
     * @param {1 | -1} d
     */
    update_pending_count(d) {
      __privateMethod(this, _Boundary_instances, update_pending_count_fn).call(this, d);
      __privateSet(this, _local_pending_count, __privateGet(this, _local_pending_count) + d);
      if (!__privateGet(this, _effect_pending) || __privateGet(this, _pending_count_update_queued)) return;
      __privateSet(this, _pending_count_update_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _pending_count_update_queued, false);
        if (__privateGet(this, _effect_pending)) {
          internal_set(__privateGet(this, _effect_pending), __privateGet(this, _local_pending_count));
        }
      });
    }
    get_effect_pending() {
      __privateGet(this, _effect_pending_subscriber).call(this);
      return get(
        /** @type {Source<number>} */
        __privateGet(this, _effect_pending)
      );
    }
    /** @param {unknown} error */
    error(error) {
      var onerror = __privateGet(this, _props).onerror;
      let failed = __privateGet(this, _props).failed;
      if (!onerror && !failed) {
        throw error;
      }
      if (__privateGet(this, _main_effect)) {
        destroy_effect(__privateGet(this, _main_effect));
        __privateSet(this, _main_effect, null);
      }
      if (__privateGet(this, _pending_effect)) {
        destroy_effect(__privateGet(this, _pending_effect));
        __privateSet(this, _pending_effect, null);
      }
      if (__privateGet(this, _failed_effect)) {
        destroy_effect(__privateGet(this, _failed_effect));
        __privateSet(this, _failed_effect, null);
      }
      var did_reset = false;
      var calling_on_error = false;
      const reset = () => {
        if (did_reset) {
          svelte_boundary_reset_noop();
          return;
        }
        did_reset = true;
        if (calling_on_error) {
          svelte_boundary_reset_onerror();
        }
        if (__privateGet(this, _failed_effect) !== null) {
          pause_effect(__privateGet(this, _failed_effect), () => {
            __privateSet(this, _failed_effect, null);
          });
        }
        __privateMethod(this, _Boundary_instances, run_fn).call(this, () => {
          Batch.ensure();
          __privateMethod(this, _Boundary_instances, render_fn).call(this);
        });
      };
      const handle_error_result = (transformed_error) => {
        try {
          calling_on_error = true;
          onerror?.(transformed_error, reset);
          calling_on_error = false;
        } catch (error2) {
          invoke_error_boundary(error2, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
        }
        if (failed) {
          __privateSet(this, _failed_effect, __privateMethod(this, _Boundary_instances, run_fn).call(this, () => {
            Batch.ensure();
            try {
              return branch(() => {
                var effect2 = (
                  /** @type {Effect} */
                  active_effect
                );
                effect2.b = this;
                effect2.f |= BOUNDARY_EFFECT;
                failed(
                  __privateGet(this, _anchor),
                  () => transformed_error,
                  () => reset
                );
              });
            } catch (error2) {
              invoke_error_boundary(
                error2,
                /** @type {Effect} */
                __privateGet(this, _effect).parent
              );
              return null;
            }
          }));
        }
      };
      queue_micro_task(() => {
        var result;
        try {
          result = this.transform_error(error);
        } catch (e) {
          invoke_error_boundary(e, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
          return;
        }
        if (result !== null && typeof result === "object" && typeof /** @type {any} */
        result.then === "function") {
          result.then(
            handle_error_result,
            /** @param {unknown} e */
            (e) => invoke_error_boundary(e, __privateGet(this, _effect) && __privateGet(this, _effect).parent)
          );
        } else {
          handle_error_result(result);
        }
      });
    }
  }
  _anchor = new WeakMap();
  _hydrate_open = new WeakMap();
  _props = new WeakMap();
  _children = new WeakMap();
  _effect = new WeakMap();
  _main_effect = new WeakMap();
  _pending_effect = new WeakMap();
  _failed_effect = new WeakMap();
  _offscreen_fragment = new WeakMap();
  _local_pending_count = new WeakMap();
  _pending_count = new WeakMap();
  _pending_count_update_queued = new WeakMap();
  _dirty_effects2 = new WeakMap();
  _maybe_dirty_effects2 = new WeakMap();
  _effect_pending = new WeakMap();
  _effect_pending_subscriber = new WeakMap();
  _Boundary_instances = new WeakSet();
  hydrate_resolved_content_fn = function() {
    try {
      __privateSet(this, _main_effect, branch(() => __privateGet(this, _children).call(this, __privateGet(this, _anchor))));
    } catch (error) {
      this.error(error);
    }
  };
  /**
   * @param {unknown} error The deserialized error from the server's hydration comment
   */
  hydrate_failed_content_fn = function(error) {
    const failed = __privateGet(this, _props).failed;
    if (!failed) return;
    __privateSet(this, _failed_effect, branch(() => {
      failed(
        __privateGet(this, _anchor),
        () => error,
        () => () => {
        }
      );
    }));
  };
  hydrate_pending_content_fn = function() {
    const pending = __privateGet(this, _props).pending;
    if (!pending) return;
    this.is_pending = true;
    __privateSet(this, _pending_effect, branch(() => pending(__privateGet(this, _anchor))));
    queue_micro_task(() => {
      var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
      var anchor = create_text();
      fragment.append(anchor);
      __privateSet(this, _main_effect, __privateMethod(this, _Boundary_instances, run_fn).call(this, () => {
        Batch.ensure();
        return branch(() => __privateGet(this, _children).call(this, anchor));
      }));
      if (__privateGet(this, _pending_count) === 0) {
        __privateGet(this, _anchor).before(fragment);
        __privateSet(this, _offscreen_fragment, null);
        pause_effect(
          /** @type {Effect} */
          __privateGet(this, _pending_effect),
          () => {
            __privateSet(this, _pending_effect, null);
          }
        );
        __privateMethod(this, _Boundary_instances, resolve_fn).call(this);
      }
    });
  };
  render_fn = function() {
    try {
      this.is_pending = this.has_pending_snippet();
      __privateSet(this, _pending_count, 0);
      __privateSet(this, _local_pending_count, 0);
      __privateSet(this, _main_effect, branch(() => {
        __privateGet(this, _children).call(this, __privateGet(this, _anchor));
      }));
      if (__privateGet(this, _pending_count) > 0) {
        var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
        move_effect(__privateGet(this, _main_effect), fragment);
        const pending = (
          /** @type {(anchor: Node) => void} */
          __privateGet(this, _props).pending
        );
        __privateSet(this, _pending_effect, branch(() => pending(__privateGet(this, _anchor))));
      } else {
        __privateMethod(this, _Boundary_instances, resolve_fn).call(this);
      }
    } catch (error) {
      this.error(error);
    }
  };
  resolve_fn = function() {
    this.is_pending = false;
    for (const e of __privateGet(this, _dirty_effects2)) {
      set_signal_status(e, DIRTY);
      schedule_effect(e);
    }
    for (const e of __privateGet(this, _maybe_dirty_effects2)) {
      set_signal_status(e, MAYBE_DIRTY);
      schedule_effect(e);
    }
    __privateGet(this, _dirty_effects2).clear();
    __privateGet(this, _maybe_dirty_effects2).clear();
  };
  /**
   * @template T
   * @param {() => T} fn
   */
  run_fn = function(fn) {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_ctx = component_context;
    set_active_effect(__privateGet(this, _effect));
    set_active_reaction(__privateGet(this, _effect));
    set_component_context(__privateGet(this, _effect).ctx);
    try {
      return fn();
    } catch (e) {
      handle_error(e);
      return null;
    } finally {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_ctx);
    }
  };
  /**
   * Updates the pending count associated with the currently visible pending snippet,
   * if any, such that we can replace the snippet with content once work is done
   * @param {1 | -1} d
   */
  update_pending_count_fn = function(d) {
    var _a2;
    if (!this.has_pending_snippet()) {
      if (this.parent) {
        __privateMethod(_a2 = this.parent, _Boundary_instances, update_pending_count_fn).call(_a2, d);
      }
      return;
    }
    __privateSet(this, _pending_count, __privateGet(this, _pending_count) + d);
    if (__privateGet(this, _pending_count) === 0) {
      __privateMethod(this, _Boundary_instances, resolve_fn).call(this);
      if (__privateGet(this, _pending_effect)) {
        pause_effect(__privateGet(this, _pending_effect), () => {
          __privateSet(this, _pending_effect, null);
        });
      }
      if (__privateGet(this, _offscreen_fragment)) {
        __privateGet(this, _anchor).before(__privateGet(this, _offscreen_fragment));
        __privateSet(this, _offscreen_fragment, null);
      }
    }
  };
  function flatten(blockers, sync, async, fn) {
    const d = is_runes() ? derived : derived_safe_equal;
    var pending = blockers.filter((b) => !b.settled);
    if (async.length === 0 && pending.length === 0) {
      fn(sync.map(d));
      return;
    }
    var parent = (
      /** @type {Effect} */
      active_effect
    );
    var restore = capture();
    var blocker_promise = pending.length === 1 ? pending[0].promise : pending.length > 1 ? Promise.all(pending.map((b) => b.promise)) : null;
    function finish(values) {
      restore();
      try {
        fn(values);
      } catch (error) {
        if ((parent.f & DESTROYED) === 0) {
          invoke_error_boundary(error, parent);
        }
      }
      unset_context();
    }
    if (async.length === 0) {
      blocker_promise.then(() => finish(sync.map(d)));
      return;
    }
    function run2() {
      restore();
      Promise.all(async.map((expression) => /* @__PURE__ */ async_derived(expression))).then((result) => finish([...sync.map(d), ...result])).catch((error) => invoke_error_boundary(error, parent));
    }
    if (blocker_promise) {
      blocker_promise.then(run2);
    } else {
      run2();
    }
  }
  function capture() {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_component_context = component_context;
    var previous_batch2 = current_batch;
    return function restore(activate_batch = true) {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_component_context);
      if (activate_batch) previous_batch2?.activate();
    };
  }
  function unset_context(deactivate_batch = true) {
    set_active_effect(null);
    set_active_reaction(null);
    set_component_context(null);
    if (deactivate_batch) current_batch?.deactivate();
  }
  function increment_pending() {
    var boundary2 = (
      /** @type {Boundary} */
      /** @type {Effect} */
      active_effect.b
    );
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var blocking = boundary2.is_rendered();
    boundary2.update_pending_count(1);
    batch.increment(blocking);
    return () => {
      boundary2.update_pending_count(-1);
      batch.decrement(blocking);
    };
  }
  // @__NO_SIDE_EFFECTS__
  function derived(fn) {
    var flags2 = DERIVED | DIRTY;
    var parent_derived = active_reaction !== null && (active_reaction.f & DERIVED) !== 0 ? (
      /** @type {Derived} */
      active_reaction
    ) : null;
    if (active_effect !== null) {
      active_effect.f |= EFFECT_PRESERVED;
    }
    const signal = {
      ctx: component_context,
      deps: null,
      effects: null,
      equals,
      f: flags2,
      fn,
      reactions: null,
      rv: 0,
      v: (
        /** @type {V} */
        UNINITIALIZED
      ),
      wv: 0,
      parent: parent_derived ?? active_effect,
      ac: null
    };
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function async_derived(fn, label, location) {
    let parent = (
      /** @type {Effect | null} */
      active_effect
    );
    if (parent === null) {
      async_derived_orphan();
    }
    var promise = (
      /** @type {Promise<V>} */
      /** @type {unknown} */
      void 0
    );
    var signal = source(
      /** @type {V} */
      UNINITIALIZED
    );
    var should_suspend = !active_reaction;
    var deferreds = /* @__PURE__ */ new Map();
    async_effect(() => {
      var d = deferred();
      promise = d.promise;
      try {
        Promise.resolve(fn()).then(d.resolve, d.reject).finally(unset_context);
      } catch (error) {
        d.reject(error);
        unset_context();
      }
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      if (should_suspend) {
        var decrement_pending = increment_pending();
        deferreds.get(batch)?.reject(STALE_REACTION);
        deferreds.delete(batch);
        deferreds.set(batch, d);
      }
      const handler = (value, error = void 0) => {
        batch.activate();
        if (error) {
          if (error !== STALE_REACTION) {
            signal.f |= ERROR_VALUE;
            internal_set(signal, error);
          }
        } else {
          if ((signal.f & ERROR_VALUE) !== 0) {
            signal.f ^= ERROR_VALUE;
          }
          internal_set(signal, value);
          for (const [b, d2] of deferreds) {
            deferreds.delete(b);
            if (b === batch) break;
            d2.reject(STALE_REACTION);
          }
        }
        if (decrement_pending) {
          decrement_pending();
        }
      };
      d.promise.then(handler, (e) => handler(null, e || "unknown"));
    });
    teardown(() => {
      for (const d of deferreds.values()) {
        d.reject(STALE_REACTION);
      }
    });
    return new Promise((fulfil) => {
      function next(p) {
        function go() {
          if (p === promise) {
            fulfil(signal);
          } else {
            next(promise);
          }
        }
        p.then(go, go);
      }
      next(promise);
    });
  }
  // @__NO_SIDE_EFFECTS__
  function user_derived(fn) {
    const d = /* @__PURE__ */ derived(fn);
    push_reaction_value(d);
    return d;
  }
  // @__NO_SIDE_EFFECTS__
  function derived_safe_equal(fn) {
    const signal = /* @__PURE__ */ derived(fn);
    signal.equals = safe_equals;
    return signal;
  }
  function destroy_derived_effects(derived2) {
    var effects = derived2.effects;
    if (effects !== null) {
      derived2.effects = null;
      for (var i = 0; i < effects.length; i += 1) {
        destroy_effect(
          /** @type {Effect} */
          effects[i]
        );
      }
    }
  }
  function get_derived_parent_effect(derived2) {
    var parent = derived2.parent;
    while (parent !== null) {
      if ((parent.f & DERIVED) === 0) {
        return (parent.f & DESTROYED) === 0 ? (
          /** @type {Effect} */
          parent
        ) : null;
      }
      parent = parent.parent;
    }
    return null;
  }
  function execute_derived(derived2) {
    var value;
    var prev_active_effect = active_effect;
    set_active_effect(get_derived_parent_effect(derived2));
    {
      try {
        derived2.f &= ~WAS_MARKED;
        destroy_derived_effects(derived2);
        value = update_reaction(derived2);
      } finally {
        set_active_effect(prev_active_effect);
      }
    }
    return value;
  }
  function update_derived(derived2) {
    var value = execute_derived(derived2);
    if (!derived2.equals(value)) {
      derived2.wv = increment_write_version();
      if (!current_batch?.is_fork || derived2.deps === null) {
        derived2.v = value;
        if (derived2.deps === null) {
          set_signal_status(derived2, CLEAN);
          return;
        }
      }
    }
    if (is_destroying_effect) {
      return;
    }
    if (batch_values !== null) {
      if (effect_tracking() || current_batch?.is_fork) {
        batch_values.set(derived2, value);
      }
    } else {
      update_derived_status(derived2);
    }
  }
  function freeze_derived_effects(derived2) {
    if (derived2.effects === null) return;
    for (const e of derived2.effects) {
      if (e.teardown || e.ac) {
        e.teardown?.();
        e.ac?.abort(STALE_REACTION);
        e.teardown = noop;
        e.ac = null;
        remove_reactions(e, 0);
        destroy_effect_children(e);
      }
    }
  }
  function unfreeze_derived_effects(derived2) {
    if (derived2.effects === null) return;
    for (const e of derived2.effects) {
      if (e.teardown) {
        update_effect(e);
      }
    }
  }
  let eager_effects = /* @__PURE__ */ new Set();
  const old_values = /* @__PURE__ */ new Map();
  let eager_effects_deferred = false;
  function source(v, stack) {
    var signal = {
      f: 0,
      // TODO ideally we could skip this altogether, but it causes type errors
      v,
      reactions: null,
      equals,
      rv: 0,
      wv: 0
    };
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function state(v, stack) {
    const s = source(v);
    push_reaction_value(s);
    return s;
  }
  // @__NO_SIDE_EFFECTS__
  function mutable_source(initial_value, immutable = false, trackable = true) {
    var _a2;
    const s = source(initial_value);
    if (!immutable) {
      s.equals = safe_equals;
    }
    if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) {
      ((_a2 = component_context.l).s ?? (_a2.s = [])).push(s);
    }
    return s;
  }
  function set(source2, value, should_proxy = false) {
    if (active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
    // to ensure we error if state is set inside an inspect effect
    (!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 && (current_sources === null || !includes.call(current_sources, source2))) {
      state_unsafe_mutation();
    }
    let new_value = should_proxy ? proxy(value) : value;
    return internal_set(source2, new_value);
  }
  function internal_set(source2, value) {
    if (!source2.equals(value)) {
      var old_value = source2.v;
      if (is_destroying_effect) {
        old_values.set(source2, value);
      } else {
        old_values.set(source2, old_value);
      }
      source2.v = value;
      var batch = Batch.ensure();
      batch.capture(source2, old_value);
      if ((source2.f & DERIVED) !== 0) {
        const derived2 = (
          /** @type {Derived} */
          source2
        );
        if ((source2.f & DIRTY) !== 0) {
          execute_derived(derived2);
        }
        update_derived_status(derived2);
      }
      source2.wv = increment_write_version();
      mark_reactions(source2, DIRTY);
      if (is_runes() && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
        if (untracked_writes === null) {
          set_untracked_writes([source2]);
        } else {
          untracked_writes.push(source2);
        }
      }
      if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) {
        flush_eager_effects();
      }
    }
    return value;
  }
  function flush_eager_effects() {
    eager_effects_deferred = false;
    for (const effect2 of eager_effects) {
      if ((effect2.f & CLEAN) !== 0) {
        set_signal_status(effect2, MAYBE_DIRTY);
      }
      if (is_dirty(effect2)) {
        update_effect(effect2);
      }
    }
    eager_effects.clear();
  }
  function update(source2, d = 1) {
    var value = get(source2);
    var result = d === 1 ? value++ : value--;
    set(source2, value);
    return result;
  }
  function increment(source2) {
    set(source2, source2.v + 1);
  }
  function mark_reactions(signal, status) {
    var reactions = signal.reactions;
    if (reactions === null) return;
    var runes = is_runes();
    var length = reactions.length;
    for (var i = 0; i < length; i++) {
      var reaction = reactions[i];
      var flags2 = reaction.f;
      if (!runes && reaction === active_effect) continue;
      var not_dirty = (flags2 & DIRTY) === 0;
      if (not_dirty) {
        set_signal_status(reaction, status);
      }
      if ((flags2 & DERIVED) !== 0) {
        var derived2 = (
          /** @type {Derived} */
          reaction
        );
        batch_values?.delete(derived2);
        if ((flags2 & WAS_MARKED) === 0) {
          if (flags2 & CONNECTED) {
            reaction.f |= WAS_MARKED;
          }
          mark_reactions(derived2, MAYBE_DIRTY);
        }
      } else if (not_dirty) {
        if ((flags2 & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
          eager_block_effects.add(
            /** @type {Effect} */
            reaction
          );
        }
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
  function proxy(value) {
    if (typeof value !== "object" || value === null || STATE_SYMBOL in value) {
      return value;
    }
    const prototype = get_prototype_of(value);
    if (prototype !== object_prototype && prototype !== array_prototype) {
      return value;
    }
    var sources = /* @__PURE__ */ new Map();
    var is_proxied_array = is_array(value);
    var version = /* @__PURE__ */ state(0);
    var parent_version = update_version;
    var with_parent = (fn) => {
      if (update_version === parent_version) {
        return fn();
      }
      var reaction = active_reaction;
      var version2 = update_version;
      set_active_reaction(null);
      set_update_version(parent_version);
      var result = fn();
      set_active_reaction(reaction);
      set_update_version(version2);
      return result;
    };
    if (is_proxied_array) {
      sources.set("length", /* @__PURE__ */ state(
        /** @type {any[]} */
        value.length
      ));
    }
    return new Proxy(
      /** @type {any} */
      value,
      {
        defineProperty(_, prop, descriptor) {
          if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
            state_descriptors_fixed();
          }
          var s = sources.get(prop);
          if (s === void 0) {
            with_parent(() => {
              var s2 = /* @__PURE__ */ state(descriptor.value);
              sources.set(prop, s2);
              return s2;
            });
          } else {
            set(s, descriptor.value, true);
          }
          return true;
        },
        deleteProperty(target, prop) {
          var s = sources.get(prop);
          if (s === void 0) {
            if (prop in target) {
              const s2 = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
              sources.set(prop, s2);
              increment(version);
            }
          } else {
            set(s, UNINITIALIZED);
            increment(version);
          }
          return true;
        },
        get(target, prop, receiver) {
          if (prop === STATE_SYMBOL) {
            return value;
          }
          var s = sources.get(prop);
          var exists = prop in target;
          if (s === void 0 && (!exists || get_descriptor(target, prop)?.writable)) {
            s = with_parent(() => {
              var p = proxy(exists ? target[prop] : UNINITIALIZED);
              var s2 = /* @__PURE__ */ state(p);
              return s2;
            });
            sources.set(prop, s);
          }
          if (s !== void 0) {
            var v = get(s);
            return v === UNINITIALIZED ? void 0 : v;
          }
          return Reflect.get(target, prop, receiver);
        },
        getOwnPropertyDescriptor(target, prop) {
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
          if (descriptor && "value" in descriptor) {
            var s = sources.get(prop);
            if (s) descriptor.value = get(s);
          } else if (descriptor === void 0) {
            var source2 = sources.get(prop);
            var value2 = source2?.v;
            if (source2 !== void 0 && value2 !== UNINITIALIZED) {
              return {
                enumerable: true,
                configurable: true,
                value: value2,
                writable: true
              };
            }
          }
          return descriptor;
        },
        has(target, prop) {
          if (prop === STATE_SYMBOL) {
            return true;
          }
          var s = sources.get(prop);
          var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop);
          if (s !== void 0 || active_effect !== null && (!has || get_descriptor(target, prop)?.writable)) {
            if (s === void 0) {
              s = with_parent(() => {
                var p = has ? proxy(target[prop]) : UNINITIALIZED;
                var s2 = /* @__PURE__ */ state(p);
                return s2;
              });
              sources.set(prop, s);
            }
            var value2 = get(s);
            if (value2 === UNINITIALIZED) {
              return false;
            }
          }
          return has;
        },
        set(target, prop, value2, receiver) {
          var s = sources.get(prop);
          var has = prop in target;
          if (is_proxied_array && prop === "length") {
            for (var i = value2; i < /** @type {Source<number>} */
            s.v; i += 1) {
              var other_s = sources.get(i + "");
              if (other_s !== void 0) {
                set(other_s, UNINITIALIZED);
              } else if (i in target) {
                other_s = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
                sources.set(i + "", other_s);
              }
            }
          }
          if (s === void 0) {
            if (!has || get_descriptor(target, prop)?.writable) {
              s = with_parent(() => /* @__PURE__ */ state(void 0));
              set(s, proxy(value2));
              sources.set(prop, s);
            }
          } else {
            has = s.v !== UNINITIALIZED;
            var p = with_parent(() => proxy(value2));
            set(s, p);
          }
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
          if (descriptor?.set) {
            descriptor.set.call(receiver, value2);
          }
          if (!has) {
            if (is_proxied_array && typeof prop === "string") {
              var ls = (
                /** @type {Source<number>} */
                sources.get("length")
              );
              var n = Number(prop);
              if (Number.isInteger(n) && n >= ls.v) {
                set(ls, n + 1);
              }
            }
            increment(version);
          }
          return true;
        },
        ownKeys(target) {
          get(version);
          var own_keys = Reflect.ownKeys(target).filter((key2) => {
            var source3 = sources.get(key2);
            return source3 === void 0 || source3.v !== UNINITIALIZED;
          });
          for (var [key, source2] of sources) {
            if (source2.v !== UNINITIALIZED && !(key in target)) {
              own_keys.push(key);
            }
          }
          return own_keys;
        },
        setPrototypeOf() {
          state_prototype_fixed();
        }
      }
    );
  }
  function get_proxied_value(value) {
    try {
      if (value !== null && typeof value === "object" && STATE_SYMBOL in value) {
        return value[STATE_SYMBOL];
      }
    } catch {
    }
    return value;
  }
  function is(a, b) {
    return Object.is(get_proxied_value(a), get_proxied_value(b));
  }
  var $window;
  var is_firefox;
  var first_child_getter;
  var next_sibling_getter;
  function init_operations() {
    if ($window !== void 0) {
      return;
    }
    $window = window;
    is_firefox = /Firefox/.test(navigator.userAgent);
    var element_prototype = Element.prototype;
    var node_prototype = Node.prototype;
    var text_prototype = Text.prototype;
    first_child_getter = get_descriptor(node_prototype, "firstChild").get;
    next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
    if (is_extensible(element_prototype)) {
      element_prototype.__click = void 0;
      element_prototype.__className = void 0;
      element_prototype.__attributes = null;
      element_prototype.__style = void 0;
      element_prototype.__e = void 0;
    }
    if (is_extensible(text_prototype)) {
      text_prototype.__t = void 0;
    }
  }
  function create_text(value = "") {
    return document.createTextNode(value);
  }
  // @__NO_SIDE_EFFECTS__
  function get_first_child(node) {
    return (
      /** @type {TemplateNode | null} */
      first_child_getter.call(node)
    );
  }
  // @__NO_SIDE_EFFECTS__
  function get_next_sibling(node) {
    return (
      /** @type {TemplateNode | null} */
      next_sibling_getter.call(node)
    );
  }
  function child(node, is_text) {
    {
      return /* @__PURE__ */ get_first_child(node);
    }
  }
  function first_child(node, is_text = false) {
    {
      var first = /* @__PURE__ */ get_first_child(node);
      if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
      return first;
    }
  }
  function sibling(node, count = 1, is_text = false) {
    let next_sibling = node;
    while (count--) {
      next_sibling = /** @type {TemplateNode} */
      /* @__PURE__ */ get_next_sibling(next_sibling);
    }
    {
      return next_sibling;
    }
  }
  function clear_text_content(node) {
    node.textContent = "";
  }
  function should_defer_append() {
    return false;
  }
  function create_element(tag, namespace, is2) {
    let options = void 0;
    return (
      /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
      document.createElementNS(NAMESPACE_HTML, tag, options)
    );
  }
  let listening_to_form_reset = false;
  function add_form_reset_listener() {
    if (!listening_to_form_reset) {
      listening_to_form_reset = true;
      document.addEventListener(
        "reset",
        (evt) => {
          Promise.resolve().then(() => {
            if (!evt.defaultPrevented) {
              for (
                const e of
                /**@type {HTMLFormElement} */
                evt.target.elements
              ) {
                e.__on_r?.();
              }
            }
          });
        },
        // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
        { capture: true }
      );
    }
  }
  function without_reactive_context(fn) {
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      return fn();
    } finally {
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  function listen_to_event_and_reset_event(element, event, handler, on_reset = handler) {
    element.addEventListener(event, () => without_reactive_context(handler));
    const prev = element.__on_r;
    if (prev) {
      element.__on_r = () => {
        prev();
        on_reset(true);
      };
    } else {
      element.__on_r = () => on_reset(true);
    }
    add_form_reset_listener();
  }
  function validate_effect(rune) {
    if (active_effect === null) {
      if (active_reaction === null) {
        effect_orphan();
      }
      effect_in_unowned_derived();
    }
    if (is_destroying_effect) {
      effect_in_teardown();
    }
  }
  function push_effect(effect2, parent_effect) {
    var parent_last = parent_effect.last;
    if (parent_last === null) {
      parent_effect.last = parent_effect.first = effect2;
    } else {
      parent_last.next = effect2;
      effect2.prev = parent_last;
      parent_effect.last = effect2;
    }
  }
  function create_effect(type, fn, sync) {
    var parent = active_effect;
    if (parent !== null && (parent.f & INERT) !== 0) {
      type |= INERT;
    }
    var effect2 = {
      ctx: component_context,
      deps: null,
      nodes: null,
      f: type | DIRTY | CONNECTED,
      first: null,
      fn,
      last: null,
      next: null,
      parent,
      b: parent && parent.b,
      prev: null,
      teardown: null,
      wv: 0,
      ac: null
    };
    if (sync) {
      try {
        update_effect(effect2);
      } catch (e2) {
        destroy_effect(effect2);
        throw e2;
      }
    } else if (fn !== null) {
      schedule_effect(effect2);
    }
    var e = effect2;
    if (sync && e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && // either `null`, or a singular child
    (e.f & EFFECT_PRESERVED) === 0) {
      e = e.first;
      if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
        e.f |= EFFECT_TRANSPARENT;
      }
    }
    if (e !== null) {
      e.parent = parent;
      if (parent !== null) {
        push_effect(e, parent);
      }
      if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0 && (type & ROOT_EFFECT) === 0) {
        var derived2 = (
          /** @type {Derived} */
          active_reaction
        );
        (derived2.effects ?? (derived2.effects = [])).push(e);
      }
    }
    return effect2;
  }
  function effect_tracking() {
    return active_reaction !== null && !untracking;
  }
  function teardown(fn) {
    const effect2 = create_effect(RENDER_EFFECT, null, false);
    set_signal_status(effect2, CLEAN);
    effect2.teardown = fn;
    return effect2;
  }
  function user_effect(fn) {
    validate_effect();
    var flags2 = (
      /** @type {Effect} */
      active_effect.f
    );
    var defer = !active_reaction && (flags2 & BRANCH_EFFECT) !== 0 && (flags2 & REACTION_RAN) === 0;
    if (defer) {
      var context = (
        /** @type {ComponentContext} */
        component_context
      );
      (context.e ?? (context.e = [])).push(fn);
    } else {
      return create_user_effect(fn);
    }
  }
  function create_user_effect(fn) {
    return create_effect(EFFECT | USER_EFFECT, fn, false);
  }
  function user_pre_effect(fn) {
    validate_effect();
    return create_effect(RENDER_EFFECT | USER_EFFECT, fn, true);
  }
  function component_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn, true);
    return (options = {}) => {
      return new Promise((fulfil) => {
        if (options.outro) {
          pause_effect(effect2, () => {
            destroy_effect(effect2);
            fulfil(void 0);
          });
        } else {
          destroy_effect(effect2);
          fulfil(void 0);
        }
      });
    };
  }
  function effect(fn) {
    return create_effect(EFFECT, fn, false);
  }
  function async_effect(fn) {
    return create_effect(ASYNC | EFFECT_PRESERVED, fn, true);
  }
  function render_effect(fn, flags2 = 0) {
    return create_effect(RENDER_EFFECT | flags2, fn, true);
  }
  function template_effect(fn, sync = [], async = [], blockers = []) {
    flatten(blockers, sync, async, (values) => {
      create_effect(RENDER_EFFECT, () => fn(...values.map(get)), true);
    });
  }
  function block(fn, flags2 = 0) {
    var effect2 = create_effect(BLOCK_EFFECT | flags2, fn, true);
    return effect2;
  }
  function branch(fn) {
    return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn, true);
  }
  function execute_effect_teardown(effect2) {
    var teardown2 = effect2.teardown;
    if (teardown2 !== null) {
      const previously_destroying_effect = is_destroying_effect;
      const previous_reaction = active_reaction;
      set_is_destroying_effect(true);
      set_active_reaction(null);
      try {
        teardown2.call(null);
      } finally {
        set_is_destroying_effect(previously_destroying_effect);
        set_active_reaction(previous_reaction);
      }
    }
  }
  function destroy_effect_children(signal, remove_dom = false) {
    var effect2 = signal.first;
    signal.first = signal.last = null;
    while (effect2 !== null) {
      const controller = effect2.ac;
      if (controller !== null) {
        without_reactive_context(() => {
          controller.abort(STALE_REACTION);
        });
      }
      var next = effect2.next;
      if ((effect2.f & ROOT_EFFECT) !== 0) {
        effect2.parent = null;
      } else {
        destroy_effect(effect2, remove_dom);
      }
      effect2 = next;
    }
  }
  function destroy_block_effect_children(signal) {
    var effect2 = signal.first;
    while (effect2 !== null) {
      var next = effect2.next;
      if ((effect2.f & BRANCH_EFFECT) === 0) {
        destroy_effect(effect2);
      }
      effect2 = next;
    }
  }
  function destroy_effect(effect2, remove_dom = true) {
    var removed = false;
    if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes !== null && effect2.nodes.end !== null) {
      remove_effect_dom(
        effect2.nodes.start,
        /** @type {TemplateNode} */
        effect2.nodes.end
      );
      removed = true;
    }
    destroy_effect_children(effect2, remove_dom && !removed);
    remove_reactions(effect2, 0);
    set_signal_status(effect2, DESTROYED);
    var transitions = effect2.nodes && effect2.nodes.t;
    if (transitions !== null) {
      for (const transition of transitions) {
        transition.stop();
      }
    }
    execute_effect_teardown(effect2);
    var parent = effect2.parent;
    if (parent !== null && parent.first !== null) {
      unlink_effect(effect2);
    }
    effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes = effect2.ac = null;
  }
  function remove_effect_dom(node, end) {
    while (node !== null) {
      var next = node === end ? null : /* @__PURE__ */ get_next_sibling(node);
      node.remove();
      node = next;
    }
  }
  function unlink_effect(effect2) {
    var parent = effect2.parent;
    var prev = effect2.prev;
    var next = effect2.next;
    if (prev !== null) prev.next = next;
    if (next !== null) next.prev = prev;
    if (parent !== null) {
      if (parent.first === effect2) parent.first = next;
      if (parent.last === effect2) parent.last = prev;
    }
  }
  function pause_effect(effect2, callback, destroy = true) {
    var transitions = [];
    pause_children(effect2, transitions, true);
    var fn = () => {
      if (destroy) destroy_effect(effect2);
      if (callback) callback();
    };
    var remaining = transitions.length;
    if (remaining > 0) {
      var check = () => --remaining || fn();
      for (var transition of transitions) {
        transition.out(check);
      }
    } else {
      fn();
    }
  }
  function pause_children(effect2, transitions, local) {
    if ((effect2.f & INERT) !== 0) return;
    effect2.f ^= INERT;
    var t = effect2.nodes && effect2.nodes.t;
    if (t !== null) {
      for (const transition of t) {
        if (transition.is_global || local) {
          transitions.push(transition);
        }
      }
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || // If this is a branch effect without a block effect parent,
      // it means the parent block effect was pruned. In that case,
      // transparency information was transferred to the branch effect.
      (child2.f & BRANCH_EFFECT) !== 0 && (effect2.f & BLOCK_EFFECT) !== 0;
      pause_children(child2, transitions, transparent ? local : false);
      child2 = sibling2;
    }
  }
  function resume_effect(effect2) {
    resume_children(effect2, true);
  }
  function resume_children(effect2, local) {
    if ((effect2.f & INERT) === 0) return;
    effect2.f ^= INERT;
    if ((effect2.f & CLEAN) === 0) {
      set_signal_status(effect2, DIRTY);
      schedule_effect(effect2);
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
      resume_children(child2, transparent ? local : false);
      child2 = sibling2;
    }
    var t = effect2.nodes && effect2.nodes.t;
    if (t !== null) {
      for (const transition of t) {
        if (transition.is_global || local) {
          transition.in();
        }
      }
    }
  }
  function move_effect(effect2, fragment) {
    if (!effect2.nodes) return;
    var node = effect2.nodes.start;
    var end = effect2.nodes.end;
    while (node !== null) {
      var next = node === end ? null : /* @__PURE__ */ get_next_sibling(node);
      fragment.append(node);
      node = next;
    }
  }
  let is_updating_effect = false;
  let is_destroying_effect = false;
  function set_is_destroying_effect(value) {
    is_destroying_effect = value;
  }
  let active_reaction = null;
  let untracking = false;
  function set_active_reaction(reaction) {
    active_reaction = reaction;
  }
  let active_effect = null;
  function set_active_effect(effect2) {
    active_effect = effect2;
  }
  let current_sources = null;
  function push_reaction_value(value) {
    if (active_reaction !== null && true) {
      if (current_sources === null) {
        current_sources = [value];
      } else {
        current_sources.push(value);
      }
    }
  }
  let new_deps = null;
  let skipped_deps = 0;
  let untracked_writes = null;
  function set_untracked_writes(value) {
    untracked_writes = value;
  }
  let write_version = 1;
  let read_version = 0;
  let update_version = read_version;
  function set_update_version(value) {
    update_version = value;
  }
  function increment_write_version() {
    return ++write_version;
  }
  function is_dirty(reaction) {
    var flags2 = reaction.f;
    if ((flags2 & DIRTY) !== 0) {
      return true;
    }
    if (flags2 & DERIVED) {
      reaction.f &= ~WAS_MARKED;
    }
    if ((flags2 & MAYBE_DIRTY) !== 0) {
      var dependencies = (
        /** @type {Value[]} */
        reaction.deps
      );
      var length = dependencies.length;
      for (var i = 0; i < length; i++) {
        var dependency = dependencies[i];
        if (is_dirty(
          /** @type {Derived} */
          dependency
        )) {
          update_derived(
            /** @type {Derived} */
            dependency
          );
        }
        if (dependency.wv > reaction.wv) {
          return true;
        }
      }
      if ((flags2 & CONNECTED) !== 0 && // During time traveling we don't want to reset the status so that
      // traversal of the graph in the other batches still happens
      batch_values === null) {
        set_signal_status(reaction, CLEAN);
      }
    }
    return false;
  }
  function schedule_possible_effect_self_invalidation(signal, effect2, root2 = true) {
    var reactions = signal.reactions;
    if (reactions === null) return;
    if (current_sources !== null && includes.call(current_sources, signal)) {
      return;
    }
    for (var i = 0; i < reactions.length; i++) {
      var reaction = reactions[i];
      if ((reaction.f & DERIVED) !== 0) {
        schedule_possible_effect_self_invalidation(
          /** @type {Derived} */
          reaction,
          effect2,
          false
        );
      } else if (effect2 === reaction) {
        if (root2) {
          set_signal_status(reaction, DIRTY);
        } else if ((reaction.f & CLEAN) !== 0) {
          set_signal_status(reaction, MAYBE_DIRTY);
        }
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
  function update_reaction(reaction) {
    var _a2;
    var previous_deps = new_deps;
    var previous_skipped_deps = skipped_deps;
    var previous_untracked_writes = untracked_writes;
    var previous_reaction = active_reaction;
    var previous_sources = current_sources;
    var previous_component_context = component_context;
    var previous_untracking = untracking;
    var previous_update_version = update_version;
    var flags2 = reaction.f;
    new_deps = /** @type {null | Value[]} */
    null;
    skipped_deps = 0;
    untracked_writes = null;
    active_reaction = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
    current_sources = null;
    set_component_context(reaction.ctx);
    untracking = false;
    update_version = ++read_version;
    if (reaction.ac !== null) {
      without_reactive_context(() => {
        reaction.ac.abort(STALE_REACTION);
      });
      reaction.ac = null;
    }
    try {
      reaction.f |= REACTION_IS_UPDATING;
      var fn = (
        /** @type {Function} */
        reaction.fn
      );
      var result = fn();
      reaction.f |= REACTION_RAN;
      var deps = reaction.deps;
      var is_fork = current_batch?.is_fork;
      if (new_deps !== null) {
        var i;
        if (!is_fork) {
          remove_reactions(reaction, skipped_deps);
        }
        if (deps !== null && skipped_deps > 0) {
          deps.length = skipped_deps + new_deps.length;
          for (i = 0; i < new_deps.length; i++) {
            deps[skipped_deps + i] = new_deps[i];
          }
        } else {
          reaction.deps = deps = new_deps;
        }
        if (effect_tracking() && (reaction.f & CONNECTED) !== 0) {
          for (i = skipped_deps; i < deps.length; i++) {
            ((_a2 = deps[i]).reactions ?? (_a2.reactions = [])).push(reaction);
          }
        }
      } else if (!is_fork && deps !== null && skipped_deps < deps.length) {
        remove_reactions(reaction, skipped_deps);
        deps.length = skipped_deps;
      }
      if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
        for (i = 0; i < /** @type {Source[]} */
        untracked_writes.length; i++) {
          schedule_possible_effect_self_invalidation(
            untracked_writes[i],
            /** @type {Effect} */
            reaction
          );
        }
      }
      if (previous_reaction !== null && previous_reaction !== reaction) {
        read_version++;
        if (previous_reaction.deps !== null) {
          for (let i2 = 0; i2 < previous_skipped_deps; i2 += 1) {
            previous_reaction.deps[i2].rv = read_version;
          }
        }
        if (previous_deps !== null) {
          for (const dep of previous_deps) {
            dep.rv = read_version;
          }
        }
        if (untracked_writes !== null) {
          if (previous_untracked_writes === null) {
            previous_untracked_writes = untracked_writes;
          } else {
            previous_untracked_writes.push(.../** @type {Source[]} */
            untracked_writes);
          }
        }
      }
      if ((reaction.f & ERROR_VALUE) !== 0) {
        reaction.f ^= ERROR_VALUE;
      }
      return result;
    } catch (error) {
      return handle_error(error);
    } finally {
      reaction.f ^= REACTION_IS_UPDATING;
      new_deps = previous_deps;
      skipped_deps = previous_skipped_deps;
      untracked_writes = previous_untracked_writes;
      active_reaction = previous_reaction;
      current_sources = previous_sources;
      set_component_context(previous_component_context);
      untracking = previous_untracking;
      update_version = previous_update_version;
    }
  }
  function remove_reaction(signal, dependency) {
    let reactions = dependency.reactions;
    if (reactions !== null) {
      var index2 = index_of.call(reactions, signal);
      if (index2 !== -1) {
        var new_length = reactions.length - 1;
        if (new_length === 0) {
          reactions = dependency.reactions = null;
        } else {
          reactions[index2] = reactions[new_length];
          reactions.pop();
        }
      }
    }
    if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
    // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
    // allows us to skip the expensive work of disconnecting and immediately reconnecting it
    (new_deps === null || !includes.call(new_deps, dependency))) {
      var derived2 = (
        /** @type {Derived} */
        dependency
      );
      if ((derived2.f & CONNECTED) !== 0) {
        derived2.f ^= CONNECTED;
        derived2.f &= ~WAS_MARKED;
      }
      update_derived_status(derived2);
      freeze_derived_effects(derived2);
      remove_reactions(derived2, 0);
    }
  }
  function remove_reactions(signal, start_index) {
    var dependencies = signal.deps;
    if (dependencies === null) return;
    for (var i = start_index; i < dependencies.length; i++) {
      remove_reaction(signal, dependencies[i]);
    }
  }
  function update_effect(effect2) {
    var flags2 = effect2.f;
    if ((flags2 & DESTROYED) !== 0) {
      return;
    }
    set_signal_status(effect2, CLEAN);
    var previous_effect = active_effect;
    var was_updating_effect = is_updating_effect;
    active_effect = effect2;
    is_updating_effect = true;
    try {
      if ((flags2 & (BLOCK_EFFECT | MANAGED_EFFECT)) !== 0) {
        destroy_block_effect_children(effect2);
      } else {
        destroy_effect_children(effect2);
      }
      execute_effect_teardown(effect2);
      var teardown2 = update_reaction(effect2);
      effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
      effect2.wv = write_version;
      var dep;
      if (DEV && tracing_mode_flag && (effect2.f & DIRTY) !== 0 && effect2.deps !== null) ;
    } finally {
      is_updating_effect = was_updating_effect;
      active_effect = previous_effect;
    }
  }
  async function tick() {
    await Promise.resolve();
    flushSync();
  }
  function get(signal) {
    var flags2 = signal.f;
    var is_derived = (flags2 & DERIVED) !== 0;
    if (active_reaction !== null && !untracking) {
      var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
      if (!destroyed && (current_sources === null || !includes.call(current_sources, signal))) {
        var deps = active_reaction.deps;
        if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
          if (signal.rv < read_version) {
            signal.rv = read_version;
            if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
              skipped_deps++;
            } else if (new_deps === null) {
              new_deps = [signal];
            } else {
              new_deps.push(signal);
            }
          }
        } else {
          (active_reaction.deps ?? (active_reaction.deps = [])).push(signal);
          var reactions = signal.reactions;
          if (reactions === null) {
            signal.reactions = [active_reaction];
          } else if (!includes.call(reactions, active_reaction)) {
            reactions.push(active_reaction);
          }
        }
      }
    }
    if (is_destroying_effect && old_values.has(signal)) {
      return old_values.get(signal);
    }
    if (is_derived) {
      var derived2 = (
        /** @type {Derived} */
        signal
      );
      if (is_destroying_effect) {
        var value = derived2.v;
        if ((derived2.f & CLEAN) === 0 && derived2.reactions !== null || depends_on_old_values(derived2)) {
          value = execute_derived(derived2);
        }
        old_values.set(derived2, value);
        return value;
      }
      var should_connect = (derived2.f & CONNECTED) === 0 && !untracking && active_reaction !== null && (is_updating_effect || (active_reaction.f & CONNECTED) !== 0);
      var is_new = (derived2.f & REACTION_RAN) === 0;
      if (is_dirty(derived2)) {
        if (should_connect) {
          derived2.f |= CONNECTED;
        }
        update_derived(derived2);
      }
      if (should_connect && !is_new) {
        unfreeze_derived_effects(derived2);
        reconnect(derived2);
      }
    }
    if (batch_values?.has(signal)) {
      return batch_values.get(signal);
    }
    if ((signal.f & ERROR_VALUE) !== 0) {
      throw signal.v;
    }
    return signal.v;
  }
  function reconnect(derived2) {
    derived2.f |= CONNECTED;
    if (derived2.deps === null) return;
    for (const dep of derived2.deps) {
      (dep.reactions ?? (dep.reactions = [])).push(derived2);
      if ((dep.f & DERIVED) !== 0 && (dep.f & CONNECTED) === 0) {
        unfreeze_derived_effects(
          /** @type {Derived} */
          dep
        );
        reconnect(
          /** @type {Derived} */
          dep
        );
      }
    }
  }
  function depends_on_old_values(derived2) {
    if (derived2.v === UNINITIALIZED) return true;
    if (derived2.deps === null) return false;
    for (const dep of derived2.deps) {
      if (old_values.has(dep)) {
        return true;
      }
      if ((dep.f & DERIVED) !== 0 && depends_on_old_values(
        /** @type {Derived} */
        dep
      )) {
        return true;
      }
    }
    return false;
  }
  function untrack(fn) {
    var previous_untracking = untracking;
    try {
      untracking = true;
      return fn();
    } finally {
      untracking = previous_untracking;
    }
  }
  function deep_read_state(value) {
    if (typeof value !== "object" || !value || value instanceof EventTarget) {
      return;
    }
    if (STATE_SYMBOL in value) {
      deep_read(value);
    } else if (!Array.isArray(value)) {
      for (let key in value) {
        const prop = value[key];
        if (typeof prop === "object" && prop && STATE_SYMBOL in prop) {
          deep_read(prop);
        }
      }
    }
  }
  function deep_read(value, visited = /* @__PURE__ */ new Set()) {
    if (typeof value === "object" && value !== null && // We don't want to traverse DOM elements
    !(value instanceof EventTarget) && !visited.has(value)) {
      visited.add(value);
      if (value instanceof Date) {
        value.getTime();
      }
      for (let key in value) {
        try {
          deep_read(value[key], visited);
        } catch (e) {
        }
      }
      const proto = get_prototype_of(value);
      if (proto !== Object.prototype && proto !== Array.prototype && proto !== Map.prototype && proto !== Set.prototype && proto !== Date.prototype) {
        const descriptors = get_descriptors(proto);
        for (let key in descriptors) {
          const get2 = descriptors[key].get;
          if (get2) {
            try {
              get2.call(value);
            } catch (e) {
            }
          }
        }
      }
    }
  }
  const PASSIVE_EVENTS = ["touchstart", "touchmove"];
  function is_passive_event(name) {
    return PASSIVE_EVENTS.includes(name);
  }
  const event_symbol = Symbol("events");
  const all_registered_events = /* @__PURE__ */ new Set();
  const root_event_handles = /* @__PURE__ */ new Set();
  function delegated(event_name, element, handler) {
    (element[event_symbol] ?? (element[event_symbol] = {}))[event_name] = handler;
  }
  function delegate(events) {
    for (var i = 0; i < events.length; i++) {
      all_registered_events.add(events[i]);
    }
    for (var fn of root_event_handles) {
      fn(events);
    }
  }
  let last_propagated_event = null;
  function handle_event_propagation(event) {
    var handler_element = this;
    var owner_document = (
      /** @type {Node} */
      handler_element.ownerDocument
    );
    var event_name = event.type;
    var path = event.composedPath?.() || [];
    var current_target = (
      /** @type {null | Element} */
      path[0] || event.target
    );
    last_propagated_event = event;
    var path_idx = 0;
    var handled_at = last_propagated_event === event && event[event_symbol];
    if (handled_at) {
      var at_idx = path.indexOf(handled_at);
      if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
      window)) {
        event[event_symbol] = handler_element;
        return;
      }
      var handler_idx = path.indexOf(handler_element);
      if (handler_idx === -1) {
        return;
      }
      if (at_idx <= handler_idx) {
        path_idx = at_idx;
      }
    }
    current_target = /** @type {Element} */
    path[path_idx] || event.target;
    if (current_target === handler_element) return;
    define_property(event, "currentTarget", {
      configurable: true,
      get() {
        return current_target || owner_document;
      }
    });
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      var throw_error;
      var other_errors = [];
      while (current_target !== null) {
        var parent_element = current_target.assignedSlot || current_target.parentNode || /** @type {any} */
        current_target.host || null;
        try {
          var delegated2 = current_target[event_symbol]?.[event_name];
          if (delegated2 != null && (!/** @type {any} */
          current_target.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          event.target === current_target)) {
            delegated2.call(current_target, event);
          }
        } catch (error) {
          if (throw_error) {
            other_errors.push(error);
          } else {
            throw_error = error;
          }
        }
        if (event.cancelBubble || parent_element === handler_element || parent_element === null) {
          break;
        }
        current_target = parent_element;
      }
      if (throw_error) {
        for (let error of other_errors) {
          queueMicrotask(() => {
            throw error;
          });
        }
        throw throw_error;
      }
    } finally {
      event[event_symbol] = handler_element;
      delete event.currentTarget;
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  const policy = (
    // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
    globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
      /** @param {string} html */
      createHTML: (html) => {
        return html;
      }
    })
  );
  function create_trusted_html(html) {
    return (
      /** @type {string} */
      policy?.createHTML(html) ?? html
    );
  }
  function create_fragment_from_html(html) {
    var elem = create_element("template");
    elem.innerHTML = create_trusted_html(html.replaceAll("<!>", "<!---->"));
    return elem.content;
  }
  function assign_nodes(start, end) {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    if (effect2.nodes === null) {
      effect2.nodes = { start, end, a: null, t: null };
    }
  }
  // @__NO_SIDE_EFFECTS__
  function from_html(content, flags2) {
    var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
    var use_import_node = (flags2 & TEMPLATE_USE_IMPORT_NODE) !== 0;
    var node;
    var has_start = !content.startsWith("<!>");
    return () => {
      if (node === void 0) {
        node = create_fragment_from_html(has_start ? content : "<!>" + content);
        if (!is_fragment) node = /** @type {TemplateNode} */
        /* @__PURE__ */ get_first_child(node);
      }
      var clone = (
        /** @type {TemplateNode} */
        use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
      );
      if (is_fragment) {
        var start = (
          /** @type {TemplateNode} */
          /* @__PURE__ */ get_first_child(clone)
        );
        var end = (
          /** @type {TemplateNode} */
          clone.lastChild
        );
        assign_nodes(start, end);
      } else {
        assign_nodes(clone, clone);
      }
      return clone;
    };
  }
  function comment() {
    var frag = document.createDocumentFragment();
    var start = document.createComment("");
    var anchor = create_text();
    frag.append(start, anchor);
    assign_nodes(start, anchor);
    return frag;
  }
  function append(anchor, dom) {
    if (anchor === null) {
      return;
    }
    anchor.before(
      /** @type {Node} */
      dom
    );
  }
  function set_text(text, value) {
    var str = value == null ? "" : typeof value === "object" ? value + "" : value;
    if (str !== (text.__t ?? (text.__t = text.nodeValue))) {
      text.__t = str;
      text.nodeValue = str + "";
    }
  }
  function mount(component, options) {
    return _mount(component, options);
  }
  const listeners = /* @__PURE__ */ new Map();
  function _mount(Component, { target, anchor, props = {}, events, context, intro = true, transformError }) {
    init_operations();
    var component = void 0;
    var unmount = component_root(() => {
      var anchor_node = anchor ?? target.appendChild(create_text());
      boundary(
        /** @type {TemplateNode} */
        anchor_node,
        {
          pending: () => {
          }
        },
        (anchor_node2) => {
          push({});
          var ctx = (
            /** @type {ComponentContext} */
            component_context
          );
          if (context) ctx.c = context;
          if (events) {
            props.$$events = events;
          }
          component = Component(anchor_node2, props) || {};
          pop();
        },
        transformError
      );
      var registered_events = /* @__PURE__ */ new Set();
      var event_handle = (events2) => {
        for (var i = 0; i < events2.length; i++) {
          var event_name = events2[i];
          if (registered_events.has(event_name)) continue;
          registered_events.add(event_name);
          var passive = is_passive_event(event_name);
          for (const node of [target, document]) {
            var counts = listeners.get(node);
            if (counts === void 0) {
              counts = /* @__PURE__ */ new Map();
              listeners.set(node, counts);
            }
            var count = counts.get(event_name);
            if (count === void 0) {
              node.addEventListener(event_name, handle_event_propagation, { passive });
              counts.set(event_name, 1);
            } else {
              counts.set(event_name, count + 1);
            }
          }
        }
      };
      event_handle(array_from(all_registered_events));
      root_event_handles.add(event_handle);
      return () => {
        for (var event_name of registered_events) {
          for (const node of [target, document]) {
            var counts = (
              /** @type {Map<string, number>} */
              listeners.get(node)
            );
            var count = (
              /** @type {number} */
              counts.get(event_name)
            );
            if (--count == 0) {
              node.removeEventListener(event_name, handle_event_propagation);
              counts.delete(event_name);
              if (counts.size === 0) {
                listeners.delete(node);
              }
            } else {
              counts.set(event_name, count);
            }
          }
        }
        root_event_handles.delete(event_handle);
        if (anchor_node !== anchor) {
          anchor_node.parentNode?.removeChild(anchor_node);
        }
      };
    });
    mounted_components.set(component, unmount);
    return component;
  }
  let mounted_components = /* @__PURE__ */ new WeakMap();
  class BranchManager {
    /**
     * @param {TemplateNode} anchor
     * @param {boolean} transition
     */
    constructor(anchor, transition = true) {
      /** @type {TemplateNode} */
      __publicField(this, "anchor");
      /** @type {Map<Batch, Key>} */
      __privateAdd(this, _batches, /* @__PURE__ */ new Map());
      /**
       * Map of keys to effects that are currently rendered in the DOM.
       * These effects are visible and actively part of the document tree.
       * Example:
       * ```
       * {#if condition}
       * 	foo
       * {:else}
       * 	bar
       * {/if}
       * ```
       * Can result in the entries `true->Effect` and `false->Effect`
       * @type {Map<Key, Effect>}
       */
      __privateAdd(this, _onscreen, /* @__PURE__ */ new Map());
      /**
       * Similar to #onscreen with respect to the keys, but contains branches that are not yet
       * in the DOM, because their insertion is deferred.
       * @type {Map<Key, Branch>}
       */
      __privateAdd(this, _offscreen, /* @__PURE__ */ new Map());
      /**
       * Keys of effects that are currently outroing
       * @type {Set<Key>}
       */
      __privateAdd(this, _outroing, /* @__PURE__ */ new Set());
      /**
       * Whether to pause (i.e. outro) on change, or destroy immediately.
       * This is necessary for `<svelte:element>`
       */
      __privateAdd(this, _transition, true);
      __privateAdd(this, _commit, () => {
        var batch = (
          /** @type {Batch} */
          current_batch
        );
        if (!__privateGet(this, _batches).has(batch)) return;
        var key = (
          /** @type {Key} */
          __privateGet(this, _batches).get(batch)
        );
        var onscreen = __privateGet(this, _onscreen).get(key);
        if (onscreen) {
          resume_effect(onscreen);
          __privateGet(this, _outroing).delete(key);
        } else {
          var offscreen = __privateGet(this, _offscreen).get(key);
          if (offscreen) {
            __privateGet(this, _onscreen).set(key, offscreen.effect);
            __privateGet(this, _offscreen).delete(key);
            offscreen.fragment.lastChild.remove();
            this.anchor.before(offscreen.fragment);
            onscreen = offscreen.effect;
          }
        }
        for (const [b, k] of __privateGet(this, _batches)) {
          __privateGet(this, _batches).delete(b);
          if (b === batch) {
            break;
          }
          const offscreen2 = __privateGet(this, _offscreen).get(k);
          if (offscreen2) {
            destroy_effect(offscreen2.effect);
            __privateGet(this, _offscreen).delete(k);
          }
        }
        for (const [k, effect2] of __privateGet(this, _onscreen)) {
          if (k === key || __privateGet(this, _outroing).has(k)) continue;
          const on_destroy = () => {
            const keys = Array.from(__privateGet(this, _batches).values());
            if (keys.includes(k)) {
              var fragment = document.createDocumentFragment();
              move_effect(effect2, fragment);
              fragment.append(create_text());
              __privateGet(this, _offscreen).set(k, { effect: effect2, fragment });
            } else {
              destroy_effect(effect2);
            }
            __privateGet(this, _outroing).delete(k);
            __privateGet(this, _onscreen).delete(k);
          };
          if (__privateGet(this, _transition) || !onscreen) {
            __privateGet(this, _outroing).add(k);
            pause_effect(effect2, on_destroy, false);
          } else {
            on_destroy();
          }
        }
      });
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _discard, (batch) => {
        __privateGet(this, _batches).delete(batch);
        const keys = Array.from(__privateGet(this, _batches).values());
        for (const [k, branch2] of __privateGet(this, _offscreen)) {
          if (!keys.includes(k)) {
            destroy_effect(branch2.effect);
            __privateGet(this, _offscreen).delete(k);
          }
        }
      });
      this.anchor = anchor;
      __privateSet(this, _transition, transition);
    }
    /**
     *
     * @param {any} key
     * @param {null | ((target: TemplateNode) => void)} fn
     */
    ensure(key, fn) {
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var defer = should_defer_append();
      if (fn && !__privateGet(this, _onscreen).has(key) && !__privateGet(this, _offscreen).has(key)) {
        if (defer) {
          var fragment = document.createDocumentFragment();
          var target = create_text();
          fragment.append(target);
          __privateGet(this, _offscreen).set(key, {
            effect: branch(() => fn(target)),
            fragment
          });
        } else {
          __privateGet(this, _onscreen).set(
            key,
            branch(() => fn(this.anchor))
          );
        }
      }
      __privateGet(this, _batches).set(batch, key);
      if (defer) {
        for (const [k, effect2] of __privateGet(this, _onscreen)) {
          if (k === key) {
            batch.unskip_effect(effect2);
          } else {
            batch.skip_effect(effect2);
          }
        }
        for (const [k, branch2] of __privateGet(this, _offscreen)) {
          if (k === key) {
            batch.unskip_effect(branch2.effect);
          } else {
            batch.skip_effect(branch2.effect);
          }
        }
        batch.oncommit(__privateGet(this, _commit));
        batch.ondiscard(__privateGet(this, _discard));
      } else {
        __privateGet(this, _commit).call(this);
      }
    }
  }
  _batches = new WeakMap();
  _onscreen = new WeakMap();
  _offscreen = new WeakMap();
  _outroing = new WeakMap();
  _transition = new WeakMap();
  _commit = new WeakMap();
  _discard = new WeakMap();
  function if_block(node, fn, elseif = false) {
    var branches = new BranchManager(node);
    var flags2 = elseif ? EFFECT_TRANSPARENT : 0;
    function update_branch(key, fn2) {
      branches.ensure(key, fn2);
    }
    block(() => {
      var has_branch = false;
      fn((fn2, key = 0) => {
        has_branch = true;
        update_branch(key, fn2);
      });
      if (!has_branch) {
        update_branch(false, null);
      }
    }, flags2);
  }
  function index(_, i) {
    return i;
  }
  function pause_effects(state2, to_destroy, controlled_anchor) {
    var transitions = [];
    var length = to_destroy.length;
    var group;
    var remaining = to_destroy.length;
    for (var i = 0; i < length; i++) {
      let effect2 = to_destroy[i];
      pause_effect(
        effect2,
        () => {
          if (group) {
            group.pending.delete(effect2);
            group.done.add(effect2);
            if (group.pending.size === 0) {
              var groups = (
                /** @type {Set<EachOutroGroup>} */
                state2.outrogroups
              );
              destroy_effects(array_from(group.done));
              groups.delete(group);
              if (groups.size === 0) {
                state2.outrogroups = null;
              }
            }
          } else {
            remaining -= 1;
          }
        },
        false
      );
    }
    if (remaining === 0) {
      var fast_path = transitions.length === 0 && controlled_anchor !== null;
      if (fast_path) {
        var anchor = (
          /** @type {Element} */
          controlled_anchor
        );
        var parent_node = (
          /** @type {Element} */
          anchor.parentNode
        );
        clear_text_content(parent_node);
        parent_node.append(anchor);
        state2.items.clear();
      }
      destroy_effects(to_destroy, !fast_path);
    } else {
      group = {
        pending: new Set(to_destroy),
        done: /* @__PURE__ */ new Set()
      };
      (state2.outrogroups ?? (state2.outrogroups = /* @__PURE__ */ new Set())).add(group);
    }
  }
  function destroy_effects(to_destroy, remove_dom = true) {
    for (var i = 0; i < to_destroy.length; i++) {
      destroy_effect(to_destroy[i], remove_dom);
    }
  }
  var offscreen_anchor;
  function each(node, flags2, get_collection, get_key, render_fn2, fallback_fn = null) {
    var anchor = node;
    var items = /* @__PURE__ */ new Map();
    {
      var parent_node = (
        /** @type {Element} */
        node
      );
      anchor = parent_node.appendChild(create_text());
    }
    var fallback = null;
    var each_array = /* @__PURE__ */ derived_safe_equal(() => {
      var collection = get_collection();
      return is_array(collection) ? collection : collection == null ? [] : array_from(collection);
    });
    var array;
    var first_run = true;
    function commit() {
      state2.fallback = fallback;
      reconcile(state2, array, anchor, flags2, get_key);
      if (fallback !== null) {
        if (array.length === 0) {
          if ((fallback.f & EFFECT_OFFSCREEN) === 0) {
            resume_effect(fallback);
          } else {
            fallback.f ^= EFFECT_OFFSCREEN;
            move(fallback, null, anchor);
          }
        } else {
          pause_effect(fallback, () => {
            fallback = null;
          });
        }
      }
    }
    var effect2 = block(() => {
      array = /** @type {V[]} */
      get(each_array);
      var length = array.length;
      var keys = /* @__PURE__ */ new Set();
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var defer = should_defer_append();
      for (var index2 = 0; index2 < length; index2 += 1) {
        var value = array[index2];
        var key = get_key(value, index2);
        var item = first_run ? null : items.get(key);
        if (item) {
          if (item.v) internal_set(item.v, value);
          if (item.i) internal_set(item.i, index2);
          if (defer) {
            batch.unskip_effect(item.e);
          }
        } else {
          item = create_item(
            items,
            first_run ? anchor : offscreen_anchor ?? (offscreen_anchor = create_text()),
            value,
            key,
            index2,
            render_fn2,
            flags2,
            get_collection
          );
          if (!first_run) {
            item.e.f |= EFFECT_OFFSCREEN;
          }
          items.set(key, item);
        }
        keys.add(key);
      }
      if (length === 0 && fallback_fn && !fallback) {
        if (first_run) {
          fallback = branch(() => fallback_fn(anchor));
        } else {
          fallback = branch(() => fallback_fn(offscreen_anchor ?? (offscreen_anchor = create_text())));
          fallback.f |= EFFECT_OFFSCREEN;
        }
      }
      if (length > keys.size) {
        {
          each_key_duplicate();
        }
      }
      if (!first_run) {
        if (defer) {
          for (const [key2, item2] of items) {
            if (!keys.has(key2)) {
              batch.skip_effect(item2.e);
            }
          }
          batch.oncommit(commit);
          batch.ondiscard(() => {
          });
        } else {
          commit();
        }
      }
      get(each_array);
    });
    var state2 = { effect: effect2, items, outrogroups: null, fallback };
    first_run = false;
  }
  function skip_to_branch(effect2) {
    while (effect2 !== null && (effect2.f & BRANCH_EFFECT) === 0) {
      effect2 = effect2.next;
    }
    return effect2;
  }
  function reconcile(state2, array, anchor, flags2, get_key) {
    var length = array.length;
    var items = state2.items;
    var current = skip_to_branch(state2.effect.first);
    var seen;
    var prev = null;
    var matched = [];
    var stashed = [];
    var value;
    var key;
    var effect2;
    var i;
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key = get_key(value, i);
      effect2 = /** @type {EachItem} */
      items.get(key).e;
      if (state2.outrogroups !== null) {
        for (const group of state2.outrogroups) {
          group.pending.delete(effect2);
          group.done.delete(effect2);
        }
      }
      if ((effect2.f & EFFECT_OFFSCREEN) !== 0) {
        effect2.f ^= EFFECT_OFFSCREEN;
        if (effect2 === current) {
          move(effect2, null, anchor);
        } else {
          var next = prev ? prev.next : current;
          if (effect2 === state2.effect.last) {
            state2.effect.last = effect2.prev;
          }
          if (effect2.prev) effect2.prev.next = effect2.next;
          if (effect2.next) effect2.next.prev = effect2.prev;
          link(state2, prev, effect2);
          link(state2, effect2, next);
          move(effect2, next, anchor);
          prev = effect2;
          matched = [];
          stashed = [];
          current = skip_to_branch(prev.next);
          continue;
        }
      }
      if ((effect2.f & INERT) !== 0) {
        resume_effect(effect2);
      }
      if (effect2 !== current) {
        if (seen !== void 0 && seen.has(effect2)) {
          if (matched.length < stashed.length) {
            var start = stashed[0];
            var j;
            prev = start.prev;
            var a = matched[0];
            var b = matched[matched.length - 1];
            for (j = 0; j < matched.length; j += 1) {
              move(matched[j], start, anchor);
            }
            for (j = 0; j < stashed.length; j += 1) {
              seen.delete(stashed[j]);
            }
            link(state2, a.prev, b.next);
            link(state2, prev, a);
            link(state2, b, start);
            current = start;
            prev = b;
            i -= 1;
            matched = [];
            stashed = [];
          } else {
            seen.delete(effect2);
            move(effect2, current, anchor);
            link(state2, effect2.prev, effect2.next);
            link(state2, effect2, prev === null ? state2.effect.first : prev.next);
            link(state2, prev, effect2);
            prev = effect2;
          }
          continue;
        }
        matched = [];
        stashed = [];
        while (current !== null && current !== effect2) {
          (seen ?? (seen = /* @__PURE__ */ new Set())).add(current);
          stashed.push(current);
          current = skip_to_branch(current.next);
        }
        if (current === null) {
          continue;
        }
      }
      if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
        matched.push(effect2);
      }
      prev = effect2;
      current = skip_to_branch(effect2.next);
    }
    if (state2.outrogroups !== null) {
      for (const group of state2.outrogroups) {
        if (group.pending.size === 0) {
          destroy_effects(array_from(group.done));
          state2.outrogroups?.delete(group);
        }
      }
      if (state2.outrogroups.size === 0) {
        state2.outrogroups = null;
      }
    }
    if (current !== null || seen !== void 0) {
      var to_destroy = [];
      if (seen !== void 0) {
        for (effect2 of seen) {
          if ((effect2.f & INERT) === 0) {
            to_destroy.push(effect2);
          }
        }
      }
      while (current !== null) {
        if ((current.f & INERT) === 0 && current !== state2.fallback) {
          to_destroy.push(current);
        }
        current = skip_to_branch(current.next);
      }
      var destroy_length = to_destroy.length;
      if (destroy_length > 0) {
        var controlled_anchor = length === 0 ? anchor : null;
        pause_effects(state2, to_destroy, controlled_anchor);
      }
    }
  }
  function create_item(items, anchor, value, key, index2, render_fn2, flags2, get_collection) {
    var v = (flags2 & EACH_ITEM_REACTIVE) !== 0 ? (flags2 & EACH_ITEM_IMMUTABLE) === 0 ? /* @__PURE__ */ mutable_source(value, false, false) : source(value) : null;
    var i = (flags2 & EACH_INDEX_REACTIVE) !== 0 ? source(index2) : null;
    return {
      v,
      i,
      e: branch(() => {
        render_fn2(anchor, v ?? value, i ?? index2, get_collection);
        return () => {
          items.delete(key);
        };
      })
    };
  }
  function move(effect2, next, anchor) {
    if (!effect2.nodes) return;
    var node = effect2.nodes.start;
    var end = effect2.nodes.end;
    var dest = next && (next.f & EFFECT_OFFSCREEN) === 0 ? (
      /** @type {EffectNodes} */
      next.nodes.start
    ) : anchor;
    while (node !== null) {
      var next_node = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ get_next_sibling(node)
      );
      dest.before(node);
      if (node === end) {
        return;
      }
      node = next_node;
    }
  }
  function link(state2, prev, next) {
    if (prev === null) {
      state2.effect.first = next;
    } else {
      prev.next = next;
    }
    if (next === null) {
      state2.effect.last = prev;
    } else {
      next.prev = prev;
    }
  }
  const whitespace = [..." 	\n\r\f \v\uFEFF"];
  function to_class(value, hash, directives) {
    var classname = "" + value;
    if (directives) {
      for (var key of Object.keys(directives)) {
        if (directives[key]) {
          classname = classname ? classname + " " + key : key;
        } else if (classname.length) {
          var len = key.length;
          var a = 0;
          while ((a = classname.indexOf(key, a)) >= 0) {
            var b = a + len;
            if ((a === 0 || whitespace.includes(classname[a - 1])) && (b === classname.length || whitespace.includes(classname[b]))) {
              classname = (a === 0 ? "" : classname.substring(0, a)) + classname.substring(b + 1);
            } else {
              a = b;
            }
          }
        }
      }
    }
    return classname === "" ? null : classname;
  }
  function to_style(value, styles) {
    return value == null ? null : String(value);
  }
  function set_class(dom, is_html, value, hash, prev_classes, next_classes) {
    var prev = dom.__className;
    if (prev !== value || prev === void 0) {
      var next_class_name = to_class(value, hash, next_classes);
      {
        if (next_class_name == null) {
          dom.removeAttribute("class");
        } else {
          dom.className = next_class_name;
        }
      }
      dom.__className = value;
    } else if (next_classes && prev_classes !== next_classes) {
      for (var key in next_classes) {
        var is_present = !!next_classes[key];
        if (prev_classes == null || is_present !== !!prev_classes[key]) {
          dom.classList.toggle(key, is_present);
        }
      }
    }
    return next_classes;
  }
  function set_style(dom, value, prev_styles, next_styles) {
    var prev = dom.__style;
    if (prev !== value) {
      var next_style_attr = to_style(value);
      {
        if (next_style_attr == null) {
          dom.removeAttribute("style");
        } else {
          dom.style.cssText = next_style_attr;
        }
      }
      dom.__style = value;
    }
    return next_styles;
  }
  function select_option(select, value, mounting = false) {
    if (select.multiple) {
      if (value == void 0) {
        return;
      }
      if (!is_array(value)) {
        return select_multiple_invalid_value();
      }
      for (var option of select.options) {
        option.selected = value.includes(get_option_value(option));
      }
      return;
    }
    for (option of select.options) {
      var option_value = get_option_value(option);
      if (is(option_value, value)) {
        option.selected = true;
        return;
      }
    }
    if (!mounting || value !== void 0) {
      select.selectedIndex = -1;
    }
  }
  function init_select(select) {
    var observer = new MutationObserver(() => {
      select_option(select, select.__value);
    });
    observer.observe(select, {
      // Listen to option element changes
      childList: true,
      subtree: true,
      // because of <optgroup>
      // Listen to option element value attribute changes
      // (doesn't get notified of select value changes,
      // because that property is not reflected as an attribute)
      attributes: true,
      attributeFilter: ["value"]
    });
    teardown(() => {
      observer.disconnect();
    });
  }
  function bind_select_value(select, get2, set2 = get2) {
    var batches2 = /* @__PURE__ */ new WeakSet();
    var mounting = true;
    listen_to_event_and_reset_event(select, "change", (is_reset) => {
      var query = is_reset ? "[selected]" : ":checked";
      var value;
      if (select.multiple) {
        value = [].map.call(select.querySelectorAll(query), get_option_value);
      } else {
        var selected_option = select.querySelector(query) ?? // will fall back to first non-disabled option if no option is selected
        select.querySelector("option:not([disabled])");
        value = selected_option && get_option_value(selected_option);
      }
      set2(value);
      if (current_batch !== null) {
        batches2.add(current_batch);
      }
    });
    effect(() => {
      var value = get2();
      if (select === document.activeElement) {
        var batch = (
          /** @type {Batch} */
          previous_batch ?? current_batch
        );
        if (batches2.has(batch)) {
          return;
        }
      }
      select_option(select, value, mounting);
      if (mounting && value === void 0) {
        var selected_option = select.querySelector(":checked");
        if (selected_option !== null) {
          value = get_option_value(selected_option);
          set2(value);
        }
      }
      select.__value = value;
      mounting = false;
    });
    init_select(select);
  }
  function get_option_value(option) {
    if ("__value" in option) {
      return option.__value;
    } else {
      return option.value;
    }
  }
  const IS_CUSTOM_ELEMENT = Symbol("is custom element");
  const IS_HTML = Symbol("is html");
  function set_checked(element, checked) {
    var attributes = get_attributes(element);
    if (attributes.checked === (attributes.checked = // treat null and undefined the same for the initial value
    checked ?? void 0)) {
      return;
    }
    element.checked = checked;
  }
  function set_attribute(element, attribute, value, skip_warning) {
    var attributes = get_attributes(element);
    if (attributes[attribute] === (attributes[attribute] = value)) return;
    if (attribute === "loading") {
      element[LOADING_ATTR_SYMBOL] = value;
    }
    if (value == null) {
      element.removeAttribute(attribute);
    } else if (typeof value !== "string" && get_setters(element).includes(attribute)) {
      element[attribute] = value;
    } else {
      element.setAttribute(attribute, value);
    }
  }
  function get_attributes(element) {
    return (
      /** @type {Record<string | symbol, unknown>} **/
      // @ts-expect-error
      element.__attributes ?? (element.__attributes = {
        [IS_CUSTOM_ELEMENT]: element.nodeName.includes("-"),
        [IS_HTML]: element.namespaceURI === NAMESPACE_HTML
      })
    );
  }
  var setters_cache = /* @__PURE__ */ new Map();
  function get_setters(element) {
    var cache_key = element.getAttribute("is") || element.nodeName;
    var setters = setters_cache.get(cache_key);
    if (setters) return setters;
    setters_cache.set(cache_key, setters = []);
    var descriptors;
    var proto = element;
    var element_proto = Element.prototype;
    while (element_proto !== proto) {
      descriptors = get_descriptors(proto);
      for (var key in descriptors) {
        if (descriptors[key].set) {
          setters.push(key);
        }
      }
      proto = get_prototype_of(proto);
    }
    return setters;
  }
  function bind_value(input, get2, set2 = get2) {
    var batches2 = /* @__PURE__ */ new WeakSet();
    listen_to_event_and_reset_event(input, "input", async (is_reset) => {
      var value = is_reset ? input.defaultValue : input.value;
      value = is_numberlike_input(input) ? to_number(value) : value;
      set2(value);
      if (current_batch !== null) {
        batches2.add(current_batch);
      }
      await tick();
      if (value !== (value = get2())) {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        var length = input.value.length;
        input.value = value ?? "";
        if (end !== null) {
          var new_length = input.value.length;
          if (start === end && end === length && new_length > length) {
            input.selectionStart = new_length;
            input.selectionEnd = new_length;
          } else {
            input.selectionStart = start;
            input.selectionEnd = Math.min(end, new_length);
          }
        }
      }
    });
    if (
      // If we are hydrating and the value has since changed,
      // then use the updated value from the input instead.
      // If defaultValue is set, then value == defaultValue
      // TODO Svelte 6: remove input.value check and set to empty string?
      untrack(get2) == null && input.value
    ) {
      set2(is_numberlike_input(input) ? to_number(input.value) : input.value);
      if (current_batch !== null) {
        batches2.add(current_batch);
      }
    }
    render_effect(() => {
      var value = get2();
      if (input === document.activeElement) {
        var batch = (
          /** @type {Batch} */
          previous_batch ?? current_batch
        );
        if (batches2.has(batch)) {
          return;
        }
      }
      if (is_numberlike_input(input) && value === to_number(input.value)) {
        return;
      }
      if (input.type === "date" && !value && !input.value) {
        return;
      }
      if (value !== input.value) {
        input.value = value ?? "";
      }
    });
  }
  function bind_checked(input, get2, set2 = get2) {
    listen_to_event_and_reset_event(input, "change", (is_reset) => {
      var value = is_reset ? input.defaultChecked : input.checked;
      set2(value);
    });
    if (
      // If we are hydrating and the value has since changed,
      // then use the update value from the input instead.
      // If defaultChecked is set, then checked == defaultChecked
      untrack(get2) == null
    ) {
      set2(input.checked);
    }
    render_effect(() => {
      var value = get2();
      input.checked = Boolean(value);
    });
  }
  function is_numberlike_input(input) {
    var type = input.type;
    return type === "number" || type === "range";
  }
  function to_number(value) {
    return value === "" ? null : +value;
  }
  function init$1(immutable = false) {
    const context = (
      /** @type {ComponentContextLegacy} */
      component_context
    );
    const callbacks = context.l.u;
    if (!callbacks) return;
    let props = () => deep_read_state(context.s);
    if (immutable) {
      let version = 0;
      let prev = (
        /** @type {Record<string, any>} */
        {}
      );
      const d = /* @__PURE__ */ derived(() => {
        let changed = false;
        const props2 = context.s;
        for (const key in props2) {
          if (props2[key] !== prev[key]) {
            prev[key] = props2[key];
            changed = true;
          }
        }
        if (changed) version++;
        return version;
      });
      props = () => get(d);
    }
    if (callbacks.b.length) {
      user_pre_effect(() => {
        observe_all(context, props);
        run_all(callbacks.b);
      });
    }
    user_effect(() => {
      const fns = untrack(() => callbacks.m.map(run));
      return () => {
        for (const fn of fns) {
          if (typeof fn === "function") {
            fn();
          }
        }
      };
    });
    if (callbacks.a.length) {
      user_effect(() => {
        observe_all(context, props);
        run_all(callbacks.a);
      });
    }
  }
  function observe_all(context, props) {
    if (context.l.s) {
      for (const signal of context.l.s) get(signal);
    }
    props();
  }
  const PUBLIC_VERSION = "5";
  if (typeof window !== "undefined") {
    ((_a = window.__svelte ?? (window.__svelte = {})).v ?? (_a.v = /* @__PURE__ */ new Set())).add(PUBLIC_VERSION);
  }
  enable_legacy_mode_flag();
  const vscode = window.vscode;
  function waitForMessage(commandName) {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const msg = event.data;
        if (msg.command === commandName) {
          window.removeEventListener("message", handler);
          if (msg.error) {
            reject(new Error(msg.error));
          } else {
            resolve(msg);
          }
        }
      };
      window.addEventListener("message", handler);
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error(`Timeout waiting for ${commandName}`));
      }, 3e4);
    });
  }
  const api = {
    /**
     * Receive messages from the queue
     */
    async receiveMessages(queueId, options) {
      const promise = waitForMessage("messagesLoaded");
      vscode.postMessage({
        command: "fetchMessages",
        queueId,
        maxMessages: options.maxMessages,
        visibilityTimeout: options.visibilityTimeout,
        waitTimeSeconds: options.waitTimeSeconds || 0
      });
      const result = await promise;
      return result.messages || [];
    },
    /**
     * Receive messages from the DLQ
     */
    async receiveDlqMessages(queueId, options) {
      const promise = waitForMessage("dlqMessagesLoaded");
      vscode.postMessage({
        command: "fetchDLQMessages",
        queueId,
        maxMessages: options.maxMessages,
        visibilityTimeout: options.visibilityTimeout
      });
      const result = await promise;
      return result.messages || [];
    },
    /**
     * Delete a single message
     */
    async deleteMessage(queueId, receiptHandle) {
      const promise = waitForMessage("messageDeleted");
      vscode.postMessage({
        command: "deleteMessage",
        queueId,
        receiptHandle
      });
      await promise;
    },
    /**
     * Redrive selected messages from DLQ to main queue
     */
    async redriveSelectedMessages(queueId, messages) {
      console.log("[API Adapter] redriveSelectedMessages called with:", { queueId, messageCount: messages.length });
      const promise = waitForMessage("redriveResult");
      const serializedMessages = JSON.parse(JSON.stringify(messages));
      const messagePayload = {
        command: "redriveSelectedMessages",
        queueId,
        messages: serializedMessages
      };
      console.log("[API Adapter] Sending postMessage with", serializedMessages.length, "messages");
      vscode.postMessage(messagePayload);
      console.log("[API Adapter] postMessage sent successfully");
      return await promise;
    },
    /**
     * Send a message to the queue
     */
    async sendMessage(queueId, body, attributes, delaySeconds, messageGroupId, messageDeduplicationId, dlq = false) {
      const promise = waitForMessage("messageSent");
      console.log("[API Adapter] sendMessage called with dlq:", dlq);
      vscode.postMessage({
        command: "sendMessage",
        queueId,
        body,
        attributes,
        delaySeconds,
        messageGroupId,
        messageDeduplicationId,
        dlq
      });
      await promise;
    },
    /**
     * Purge the queue
     */
    async purgeQueue(queueId) {
      const promise = waitForMessage("queuePurged");
      vscode.postMessage({
        command: "purgeQueue",
        queueId
      });
      await promise;
    },
    /**
     * Get queue configuration (not needed for extension, queue is passed via context)
     */
    async getQueueConfiguration(queueId) {
      throw new Error("getQueueConfiguration not supported in extension context");
    }
  };
  class ExtensionStore {
    constructor() {
      __privateAdd(
        this,
        _selectedQueue,
        // Queue is provided by extension, not fetched
        /* @__PURE__ */ state(null)
      );
      __privateAdd(this, _messages, /* @__PURE__ */ state(proxy([])));
      __privateAdd(this, _dlqMessages, /* @__PURE__ */ state(proxy([])));
      __privateAdd(this, _searchTerm, /* @__PURE__ */ state(""));
      __privateAdd(this, _viewMode, /* @__PURE__ */ state("table"));
      __privateAdd(this, _activeTab, /* @__PURE__ */ state("queue"));
      __privateAdd(this, _selectedMessageIds, /* @__PURE__ */ state(proxy(/* @__PURE__ */ new Set())));
      __privateAdd(this, _loading, /* @__PURE__ */ state(proxy({ messages: false, dlqMessages: false, operation: false })));
      __privateAdd(this, _error, /* @__PURE__ */ state(null));
      __privateAdd(this, _filteredMessages, /* @__PURE__ */ user_derived(() => {
        if (!this.searchTerm) return this.messages;
        const term = this.searchTerm.toLowerCase();
        return this.messages.filter((msg) => msg.body.toLowerCase().includes(term) || JSON.stringify(msg.messageAttributes).toLowerCase().includes(term));
      }));
      __privateAdd(this, _hasDLQ, /* @__PURE__ */ user_derived(() => {
        return this.selectedQueue?.dlqUrl != null;
      }));
    }
    get selectedQueue() {
      return get(__privateGet(this, _selectedQueue));
    }
    set selectedQueue(value) {
      set(__privateGet(this, _selectedQueue), value, true);
    }
    get messages() {
      return get(__privateGet(this, _messages));
    }
    set messages(value) {
      set(__privateGet(this, _messages), value, true);
    }
    get dlqMessages() {
      return get(__privateGet(this, _dlqMessages));
    }
    set dlqMessages(value) {
      set(__privateGet(this, _dlqMessages), value, true);
    }
    get searchTerm() {
      return get(__privateGet(this, _searchTerm));
    }
    set searchTerm(value) {
      set(__privateGet(this, _searchTerm), value, true);
    }
    get viewMode() {
      return get(__privateGet(this, _viewMode));
    }
    set viewMode(value) {
      set(__privateGet(this, _viewMode), value, true);
    }
    get activeTab() {
      return get(__privateGet(this, _activeTab));
    }
    set activeTab(value) {
      set(__privateGet(this, _activeTab), value, true);
    }
    get selectedMessageIds() {
      return get(__privateGet(this, _selectedMessageIds));
    }
    set selectedMessageIds(value) {
      set(__privateGet(this, _selectedMessageIds), value, true);
    }
    get loading() {
      return get(__privateGet(this, _loading));
    }
    set loading(value) {
      set(__privateGet(this, _loading), value, true);
    }
    get error() {
      return get(__privateGet(this, _error));
    }
    set error(value) {
      set(__privateGet(this, _error), value, true);
    }
    get filteredMessages() {
      return get(__privateGet(this, _filteredMessages));
    }
    set filteredMessages(value) {
      set(__privateGet(this, _filteredMessages), value);
    }
    get hasDLQ() {
      return get(__privateGet(this, _hasDLQ));
    }
    set hasDLQ(value) {
      set(__privateGet(this, _hasDLQ), value);
    }
    selectQueue(queue) {
      this.selectedQueue = queue;
      this.messages = [];
      this.dlqMessages = [];
    }
    setMessages(newMessages) {
      this.messages = newMessages;
    }
    removeMessage(receiptHandle) {
      this.messages = this.messages.filter((m) => m.receiptHandle !== receiptHandle);
    }
    setLoading(key, value) {
      this.loading[key] = value;
    }
    setError(message) {
      this.error = message;
    }
    clearError() {
      this.error = null;
    }
    setSearchTerm(term) {
      this.searchTerm = term;
    }
    setViewMode(mode) {
      this.viewMode = mode;
    }
    setActiveTab(tab) {
      this.activeTab = tab;
    }
    setDlqMessages(messages) {
      this.dlqMessages = messages;
    }
    toggleMessageSelection(messageId) {
      if (this.selectedMessageIds.has(messageId)) {
        this.selectedMessageIds.delete(messageId);
      } else {
        this.selectedMessageIds.add(messageId);
      }
      this.selectedMessageIds = new Set(this.selectedMessageIds);
    }
    selectAllMessages() {
      const currentMessages = this.activeTab === "main" ? this.messages : this.dlqMessages;
      this.selectedMessageIds = new Set(currentMessages.map((m) => m.messageId));
    }
    clearSelection() {
      this.selectedMessageIds = /* @__PURE__ */ new Set();
    }
  }
  _selectedQueue = new WeakMap();
  _messages = new WeakMap();
  _dlqMessages = new WeakMap();
  _searchTerm = new WeakMap();
  _viewMode = new WeakMap();
  _activeTab = new WeakMap();
  _selectedMessageIds = new WeakMap();
  _loading = new WeakMap();
  _error = new WeakMap();
  _filteredMessages = new WeakMap();
  _hasDLQ = new WeakMap();
  const store = new ExtensionStore();
  var root_2$3 = /* @__PURE__ */ from_html(`<div class="confirm-dialog svelte-1j1skn0"><div class="confirm-content svelte-1j1skn0"><p class="svelte-1j1skn0"> </p> <div class="confirm-actions svelte-1j1skn0"><button class="btn-danger svelte-1j1skn0"> </button> <button class="btn-secondary-action svelte-1j1skn0">Cancel</button></div></div></div>`);
  var root_3$3 = /* @__PURE__ */ from_html(`<div class="success svelte-1j1skn0"> </div>`);
  var root_4$2 = /* @__PURE__ */ from_html(`<div class="detail-item dlq svelte-1j1skn0"><span class="label svelte-1j1skn0">Dead Letter Queue:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item dlq svelte-1j1skn0"><span class="label svelte-1j1skn0">DLQ URL:</span> <span class="value svelte-1j1skn0"> </span></div>`, 1);
  var root_5$2 = /* @__PURE__ */ from_html(`<div class="error svelte-1j1skn0"> </div>`);
  var root_1$1 = /* @__PURE__ */ from_html(`<div class="queue-details svelte-1j1skn0"><div class="header svelte-1j1skn0"><h2 class="svelte-1j1skn0"> </h2> <div class="header-actions svelte-1j1skn0"><button class="btn-secondary svelte-1j1skn0" title="Close and reopen queue view to refresh">🔄 Refresh</button> <button class="btn-danger svelte-1j1skn0"> </button></div></div> <!> <!> <div class="details-grid svelte-1j1skn0"><div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Queue URL:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Region:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Messages Available:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Messages In Flight:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Messages Delayed:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Visibility Timeout:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Message Retention:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Max Message Size:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Receive Wait Time:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Delay Seconds:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Created:</span> <span class="value svelte-1j1skn0"> </span></div> <div class="detail-item svelte-1j1skn0"><span class="label svelte-1j1skn0">Last Modified:</span> <span class="value svelte-1j1skn0"> </span></div> <!></div> <div class="info-box svelte-1j1skn0"><strong class="svelte-1j1skn0">ℹ️ About Message Counts:</strong> <p class="svelte-1j1skn0"><strong class="svelte-1j1skn0">Messages Available:</strong> Total messages in the queue
                (from when queue was loaded).<br/> <strong class="svelte-1j1skn0">Messages In Flight:</strong> Messages currently
                invisible (being processed or within visibility timeout).<br/> <br/> <strong class="svelte-1j1skn0">Why you may see fewer messages in the table:</strong><br/> • Each "Receive Messages" call gets <em>up to</em> the max
                messages you request<br/> • SQS doesn't guarantee you'll get all available messages in one
                call<br/> • Messages become invisible for the visibility timeout after being
                received<br/> • Queue attributes are cached - reload the queue from sidebar to
                refresh<br/> <br/> 💡 <strong class="svelte-1j1skn0">Tip:</strong> To see more messages, click "Receive Messages"
                multiple times or increase "Max Messages" to 10.</p></div> <!></div>`);
  function QueueDetailsExtension($$anchor, $$props) {
    push($$props, true);
    let purging = /* @__PURE__ */ state(false);
    let purgeError = /* @__PURE__ */ state(null);
    let confirmPurge = /* @__PURE__ */ state(false);
    let successMessage = /* @__PURE__ */ state(null);
    async function handleRefresh() {
      set(purgeError, "Refresh not supported in extension. Close and reopen the queue view to refresh.");
      setTimeout(() => set(purgeError, null), 5e3);
    }
    async function handlePurge() {
      if (!store.selectedQueue) return;
      set(confirmPurge, true);
    }
    async function confirmPurgeQueue() {
      if (!store.selectedQueue) return;
      try {
        set(purging, true);
        set(purgeError, null);
        set(successMessage, null);
        set(confirmPurge, false);
        await api.purgeQueue(store.selectedQueue.id);
        set(successMessage, "Queue purged successfully");
        setTimeout(() => set(successMessage, null), 5e3);
      } catch (error) {
        set(purgeError, error instanceof Error ? error.message : "Failed to purge queue", true);
      } finally {
        set(purging, false);
      }
    }
    function cancelPurge() {
      set(confirmPurge, false);
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent_4 = ($$anchor2) => {
        var div = root_1$1();
        var div_1 = child(div);
        var h2 = child(div_1);
        var text = child(h2);
        var div_2 = sibling(h2, 2);
        var button = child(div_2);
        var button_1 = sibling(button, 2);
        var text_1 = child(button_1);
        var node_1 = sibling(div_1, 2);
        {
          var consequent = ($$anchor3) => {
            var div_3 = root_2$3();
            var div_4 = child(div_3);
            var p = child(div_4);
            var text_2 = child(p);
            var div_5 = sibling(p, 2);
            var button_2 = child(div_5);
            var text_3 = child(button_2);
            var button_3 = sibling(button_2, 2);
            template_effect(() => {
              set_text(text_2, `Are you sure you want to purge all messages from "${store.selectedQueue.queueName ?? ""}"? This action cannot be
                        undone.`);
              button_2.disabled = get(purging);
              set_text(text_3, get(purging) ? "Purging..." : "Purge");
              button_3.disabled = get(purging);
            });
            delegated("click", button_2, confirmPurgeQueue);
            delegated("click", button_3, cancelPurge);
            append($$anchor3, div_3);
          };
          if_block(node_1, ($$render) => {
            if (get(confirmPurge)) $$render(consequent);
          });
        }
        var node_2 = sibling(node_1, 2);
        {
          var consequent_1 = ($$anchor3) => {
            var div_6 = root_3$3();
            var text_4 = child(div_6);
            template_effect(() => set_text(text_4, get(successMessage)));
            append($$anchor3, div_6);
          };
          if_block(node_2, ($$render) => {
            if (get(successMessage)) $$render(consequent_1);
          });
        }
        var div_7 = sibling(node_2, 2);
        var div_8 = child(div_7);
        var span = sibling(child(div_8), 2);
        var text_5 = child(span);
        var div_9 = sibling(div_8, 2);
        var span_1 = sibling(child(div_9), 2);
        var text_6 = child(span_1);
        var div_10 = sibling(div_9, 2);
        var span_2 = sibling(child(div_10), 2);
        var text_7 = child(span_2);
        var div_11 = sibling(div_10, 2);
        var span_3 = sibling(child(div_11), 2);
        var text_8 = child(span_3);
        var div_12 = sibling(div_11, 2);
        var span_4 = sibling(child(div_12), 2);
        var text_9 = child(span_4);
        var div_13 = sibling(div_12, 2);
        var span_5 = sibling(child(div_13), 2);
        var text_10 = child(span_5);
        var div_14 = sibling(div_13, 2);
        var span_6 = sibling(child(div_14), 2);
        var text_11 = child(span_6);
        var div_15 = sibling(div_14, 2);
        var span_7 = sibling(child(div_15), 2);
        var text_12 = child(span_7);
        var div_16 = sibling(div_15, 2);
        var span_8 = sibling(child(div_16), 2);
        var text_13 = child(span_8);
        var div_17 = sibling(div_16, 2);
        var span_9 = sibling(child(div_17), 2);
        var text_14 = child(span_9);
        var div_18 = sibling(div_17, 2);
        var span_10 = sibling(child(div_18), 2);
        var text_15 = child(span_10);
        var div_19 = sibling(div_18, 2);
        var span_11 = sibling(child(div_19), 2);
        var text_16 = child(span_11);
        var node_3 = sibling(div_19, 2);
        {
          var consequent_2 = ($$anchor3) => {
            var fragment_1 = root_4$2();
            var div_20 = first_child(fragment_1);
            var span_12 = sibling(child(div_20), 2);
            var text_17 = child(span_12);
            var div_21 = sibling(div_20, 2);
            var span_13 = sibling(child(div_21), 2);
            var text_18 = child(span_13);
            template_effect(() => {
              set_text(text_17, store.selectedQueue.dlqName);
              set_text(text_18, store.selectedQueue.dlqUrl);
            });
            append($$anchor3, fragment_1);
          };
          if_block(node_3, ($$render) => {
            if (store.selectedQueue.dlqUrl) $$render(consequent_2);
          });
        }
        var node_4 = sibling(div_7, 4);
        {
          var consequent_3 = ($$anchor3) => {
            var div_22 = root_5$2();
            var text_19 = child(div_22);
            template_effect(() => set_text(text_19, get(purgeError)));
            append($$anchor3, div_22);
          };
          if_block(node_4, ($$render) => {
            if (get(purgeError)) $$render(consequent_3);
          });
        }
        template_effect(
          ($0, $1, $2, $3) => {
            set_text(text, store.selectedQueue.queueName);
            button_1.disabled = get(purging);
            set_text(text_1, get(purging) ? "Purging..." : "Purge Queue");
            set_text(text_5, store.selectedQueue.queueUrl);
            set_text(text_6, store.selectedQueue.region);
            set_text(text_7, store.selectedQueue.attributes?.ApproximateNumberOfMessages ?? "N/A");
            set_text(text_8, store.selectedQueue.attributes?.ApproximateNumberOfMessagesNotVisible ?? "N/A");
            set_text(text_9, store.selectedQueue.attributes?.ApproximateNumberOfMessagesDelayed ?? "N/A");
            set_text(text_10, `${store.selectedQueue.attributes?.VisibilityTimeout ?? "N/A" ?? ""}s`);
            set_text(text_11, $0);
            set_text(text_12, $1);
            set_text(text_13, `${store.selectedQueue.attributes?.ReceiveMessageWaitTimeSeconds ?? "N/A" ?? ""}s`);
            set_text(text_14, `${store.selectedQueue.attributes?.DelaySeconds ?? "N/A" ?? ""}s`);
            set_text(text_15, $2);
            set_text(text_16, $3);
          },
          [
            () => store.selectedQueue.attributes?.MessageRetentionPeriod ? `${Math.floor(Number(store.selectedQueue.attributes.MessageRetentionPeriod) / 86400)} days` : "N/A",
            () => store.selectedQueue.attributes?.MaximumMessageSize ? `${Math.floor(Number(store.selectedQueue.attributes.MaximumMessageSize) / 1024)} KB` : "N/A",
            () => store.selectedQueue.attributes?.CreatedTimestamp ? new Date(Number(store.selectedQueue.attributes.CreatedTimestamp) * 1e3).toLocaleString() : "N/A",
            () => store.selectedQueue.attributes?.LastModifiedTimestamp ? new Date(Number(store.selectedQueue.attributes.LastModifiedTimestamp) * 1e3).toLocaleString() : "N/A"
          ]
        );
        delegated("click", button, handleRefresh);
        delegated("click", button_1, handlePurge);
        append($$anchor2, div);
      };
      if_block(node, ($$render) => {
        if (store.selectedQueue) $$render(consequent_4);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  delegate(["click"]);
  var root_2$2 = /* @__PURE__ */ from_html(`<div class="form-group svelte-5a3nm6"><label for="message-dedup-id" class="svelte-5a3nm6">Message Deduplication ID: <span class="optional svelte-5a3nm6">(optional)</span></label> <input id="message-dedup-id" type="text" placeholder="e.g., unique-message-id-123" class="input-text svelte-5a3nm6" title="Token for deduplication of sent messages"/> <small class="help-text svelte-5a3nm6">Leave empty to use content-based deduplication</small></div>`);
  var root_3$2 = /* @__PURE__ */ from_html(`<div class="info-message svelte-5a3nm6"><strong class="svelte-5a3nm6">ℹ️ Content-Based Deduplication Enabled</strong> <p class="svelte-5a3nm6">This queue uses content-based deduplication. Message Deduplication ID is not required.</p></div>`);
  var root_1 = /* @__PURE__ */ from_html(`<div class="fifo-section svelte-5a3nm6"><div class="fifo-header svelte-5a3nm6"><strong>FIFO Queue Parameters</strong> <span class="fifo-badge svelte-5a3nm6">FIFO</span></div> <div class="form-group svelte-5a3nm6"><label for="message-group-id" class="svelte-5a3nm6">Message Group ID: <span class="required svelte-5a3nm6">*</span></label> <input id="message-group-id" type="text" placeholder="e.g., order-processing-group" class="input-text svelte-5a3nm6" title="Messages with the same Message Group ID are processed in order"/> <small class="help-text svelte-5a3nm6">Messages with the same group ID are processed in FIFO order</small></div> <!></div>`);
  var root_5$1 = /* @__PURE__ */ from_html(`<div class="attribute-row svelte-5a3nm6"><input type="text" placeholder="Key (e.g., type)" class="input-attr-key svelte-5a3nm6" title="Attribute name"/> <select class="input-attr-type svelte-5a3nm6" title="Data type"><option>String</option><option>Number</option><option>Binary</option><option>String.json</option><option>String.xml</option><option>Number.int</option><option>Number.float</option></select> <input type="text" class="input-attr-value svelte-5a3nm6" title="Attribute value"/> <button class="btn-remove-attr svelte-5a3nm6" title="Remove attribute">×</button></div>`);
  var root_4$1 = /* @__PURE__ */ from_html(`<div class="attributes-list svelte-5a3nm6"></div>`);
  var root_6$1 = /* @__PURE__ */ from_html(`<div class="error svelte-5a3nm6"> </div>`);
  var root_7$1 = /* @__PURE__ */ from_html(`<div class="success svelte-5a3nm6"> </div>`);
  var root$2 = /* @__PURE__ */ from_html(`<div class="message-composer svelte-5a3nm6"><h3 class="svelte-5a3nm6">Send Message</h3> <div class="form-group svelte-5a3nm6"><label for="message-body" class="svelte-5a3nm6">Message Body:</label> <textarea id="message-body" placeholder="Enter message body..." rows="8" class="textarea svelte-5a3nm6"></textarea></div> <div class="form-row svelte-5a3nm6"><label class="checkbox-label svelte-5a3nm6"><input type="checkbox" class="svelte-5a3nm6"/> Validate JSON format</label> <label class="svelte-5a3nm6">Delay (seconds): <input type="number" min="0" max="900" class="input-small svelte-5a3nm6"/></label></div> <!> <div class="attributes-section svelte-5a3nm6"><div class="attributes-header svelte-5a3nm6"><strong>Message Attributes:</strong> <button class="btn-small svelte-5a3nm6">+ Add Attribute</button></div> <!></div> <!> <!> <button class="btn-primary svelte-5a3nm6"> </button></div>`);
  function MessageComposerExtension($$anchor, $$props) {
    push($$props, true);
    let messageBody = /* @__PURE__ */ state("");
    let validateJson = /* @__PURE__ */ state(false);
    let delaySeconds = /* @__PURE__ */ state(0);
    let messageGroupId = /* @__PURE__ */ state("");
    let messageDeduplicationId = /* @__PURE__ */ state("");
    let attributes = /* @__PURE__ */ state(proxy([]));
    let nextAttributeId = /* @__PURE__ */ state(0);
    let sending = /* @__PURE__ */ state(false);
    let error = /* @__PURE__ */ state(null);
    let success = /* @__PURE__ */ state(null);
    const isFifoQueue = /* @__PURE__ */ user_derived(() => {
      return store.selectedQueue?.queueName?.endsWith(".fifo") ?? false;
    });
    const hasContentBasedDeduplication = /* @__PURE__ */ user_derived(() => {
      return store.selectedQueue?.attributes?.ContentBasedDeduplication === "true";
    });
    function addAttribute() {
      set(
        attributes,
        [
          ...get(attributes),
          {
            id: update(nextAttributeId),
            key: "",
            value: "",
            dataType: "String"
          }
        ],
        true
      );
    }
    function removeAttribute(id) {
      set(attributes, get(attributes).filter((attr) => attr.id !== id), true);
    }
    function validateJsonFormat() {
      if (!get(validateJson)) return true;
      try {
        JSON.parse(get(messageBody));
        return true;
      } catch {
        return false;
      }
    }
    async function sendMessage() {
      if (!store.selectedQueue) return;
      if (!get(messageBody).trim()) {
        set(error, "Message body is required");
        return;
      }
      if (get(isFifoQueue) && !get(messageGroupId).trim()) {
        set(error, "Message Group ID is required for FIFO queues");
        return;
      }
      if (get(validateJson) && !validateJsonFormat()) {
        set(error, "Invalid JSON format");
        return;
      }
      try {
        set(sending, true);
        set(error, null);
        set(success, null);
        const messageAttributes = {};
        get(attributes).filter((attr) => attr.key.trim() && attr.value.trim()).forEach((attr) => {
          messageAttributes[attr.key] = { dataType: attr.dataType || "String", stringValue: attr.value };
        });
        const result = await api.sendMessage(store.selectedQueue.id, get(messageBody), messageAttributes, get(delaySeconds), get(isFifoQueue) ? get(messageGroupId) : void 0, get(isFifoQueue) && get(messageDeduplicationId) ? get(messageDeduplicationId) : void 0, store.activeTab === "dlq");
        set(success, `Message sent successfully!`);
        setTimeout(() => set(success, null), 5e3);
        set(messageBody, "");
        set(attributes, [], true);
        set(delaySeconds, 0);
        if (get(isFifoQueue)) {
          set(messageDeduplicationId, "");
        }
      } catch (err) {
        set(error, err instanceof Error ? err.message : "Failed to send message", true);
      } finally {
        set(sending, false);
      }
    }
    var div = root$2();
    var div_1 = sibling(child(div), 2);
    var textarea = sibling(child(div_1), 2);
    var div_2 = sibling(div_1, 2);
    var label = child(div_2);
    var input = child(label);
    var label_1 = sibling(label, 2);
    var input_1 = sibling(child(label_1));
    var node = sibling(div_2, 2);
    {
      var consequent_1 = ($$anchor2) => {
        var div_3 = root_1();
        var div_4 = sibling(child(div_3), 2);
        var input_2 = sibling(child(div_4), 2);
        var node_1 = sibling(div_4, 2);
        {
          var consequent = ($$anchor3) => {
            var div_5 = root_2$2();
            var input_3 = sibling(child(div_5), 2);
            bind_value(input_3, () => get(messageDeduplicationId), ($$value) => set(messageDeduplicationId, $$value));
            append($$anchor3, div_5);
          };
          var alternate = ($$anchor3) => {
            var div_6 = root_3$2();
            append($$anchor3, div_6);
          };
          if_block(node_1, ($$render) => {
            if (!get(hasContentBasedDeduplication)) $$render(consequent);
            else $$render(alternate, false);
          });
        }
        bind_value(input_2, () => get(messageGroupId), ($$value) => set(messageGroupId, $$value));
        append($$anchor2, div_3);
      };
      if_block(node, ($$render) => {
        if (get(isFifoQueue)) $$render(consequent_1);
      });
    }
    var div_7 = sibling(node, 2);
    var div_8 = child(div_7);
    var button = sibling(child(div_8), 2);
    var node_2 = sibling(div_8, 2);
    {
      var consequent_2 = ($$anchor2) => {
        var div_9 = root_4$1();
        each(div_9, 21, () => get(attributes), (attr) => attr.id, ($$anchor3, attr, $$index) => {
          var div_10 = root_5$1();
          var input_4 = child(div_10);
          var select = sibling(input_4, 2);
          var option = child(select);
          option.value = option.__value = "String";
          var option_1 = sibling(option);
          option_1.value = option_1.__value = "Number";
          var option_2 = sibling(option_1);
          option_2.value = option_2.__value = "Binary";
          var option_3 = sibling(option_2);
          option_3.value = option_3.__value = "String.json";
          var option_4 = sibling(option_3);
          option_4.value = option_4.__value = "String.xml";
          var option_5 = sibling(option_4);
          option_5.value = option_5.__value = "Number.int";
          var option_6 = sibling(option_5);
          option_6.value = option_6.__value = "Number.float";
          var input_5 = sibling(select, 2);
          var button_1 = sibling(input_5, 2);
          template_effect(() => set_attribute(input_5, "placeholder", get(attr).dataType === "Number" || get(attr).dataType === "Number.int" || get(attr).dataType === "Number.float" ? "Value (number)" : get(attr).dataType === "Binary" ? "Value (base64)" : "Value"));
          bind_value(input_4, () => get(attr).key, ($$value) => get(attr).key = $$value);
          bind_select_value(select, () => get(attr).dataType, ($$value) => get(attr).dataType = $$value);
          bind_value(input_5, () => get(attr).value, ($$value) => get(attr).value = $$value);
          delegated("click", button_1, () => removeAttribute(get(attr).id));
          append($$anchor3, div_10);
        });
        append($$anchor2, div_9);
      };
      if_block(node_2, ($$render) => {
        if (get(attributes).length > 0) $$render(consequent_2);
      });
    }
    var node_3 = sibling(div_7, 2);
    {
      var consequent_3 = ($$anchor2) => {
        var div_11 = root_6$1();
        var text = child(div_11);
        template_effect(() => set_text(text, get(error)));
        append($$anchor2, div_11);
      };
      if_block(node_3, ($$render) => {
        if (get(error)) $$render(consequent_3);
      });
    }
    var node_4 = sibling(node_3, 2);
    {
      var consequent_4 = ($$anchor2) => {
        var div_12 = root_7$1();
        var text_1 = child(div_12);
        template_effect(() => set_text(text_1, get(success)));
        append($$anchor2, div_12);
      };
      if_block(node_4, ($$render) => {
        if (get(success)) $$render(consequent_4);
      });
    }
    var button_2 = sibling(node_4, 2);
    var text_2 = child(button_2);
    template_effect(() => {
      button_2.disabled = get(sending) || !store.selectedQueue;
      set_text(text_2, get(sending) ? "Sending..." : "Send Message");
    });
    bind_value(textarea, () => get(messageBody), ($$value) => set(messageBody, $$value));
    bind_checked(input, () => get(validateJson), ($$value) => set(validateJson, $$value));
    bind_value(input_1, () => get(delaySeconds), ($$value) => set(delaySeconds, $$value));
    delegated("click", button, addAttribute);
    delegated("click", button_2, sendMessage);
    append($$anchor, div);
    pop();
  }
  delegate(["click"]);
  var root_3$1 = /* @__PURE__ */ from_html(`<button class="btn-danger stop-button svelte-ih63xe">Stop</button>`);
  var root_4 = /* @__PURE__ */ from_html(`<div class="progress-container svelte-ih63xe"><div class="progress-bar svelte-ih63xe"><div class="progress-fill svelte-ih63xe"></div></div> <div class="progress-text svelte-ih63xe"> </div></div>`);
  var root_5 = /* @__PURE__ */ from_html(`<div class="error svelte-ih63xe"> </div>`);
  var root_6 = /* @__PURE__ */ from_html(`<div class="success svelte-ih63xe"> </div>`);
  var root_7 = /* @__PURE__ */ from_html(`<div class="confirm-dialog svelte-ih63xe"><div class="confirm-content svelte-ih63xe"><p class="svelte-ih63xe"> </p> <div class="confirm-actions svelte-ih63xe"><button class="btn-danger svelte-ih63xe">Delete</button> <button class="btn-secondary-action svelte-ih63xe">Cancel</button></div></div></div>`);
  var root_8 = /* @__PURE__ */ from_html(`<div class="confirm-dialog svelte-ih63xe"><div class="confirm-content svelte-ih63xe"><p class="svelte-ih63xe">Are you sure you want to delete this message? This
                        action cannot be undone.</p> <div class="confirm-actions svelte-ih63xe"><button class="btn-danger svelte-ih63xe">Delete</button> <button class="btn-secondary-action svelte-ih63xe">Cancel</button></div></div></div>`);
  var root_9 = /* @__PURE__ */ from_html(`<div class="confirm-dialog svelte-ih63xe"><div class="confirm-content svelte-ih63xe"><p class="svelte-ih63xe"> </p> <div class="confirm-actions svelte-ih63xe"><button class="btn-primary svelte-ih63xe"> </button> <button class="btn-secondary-action svelte-ih63xe">Cancel</button></div></div></div>`);
  var root_11 = /* @__PURE__ */ from_html(`<button class="btn-primary svelte-ih63xe">Redrive Selected</button>`);
  var root_10 = /* @__PURE__ */ from_html(`<div class="bulk-actions svelte-ih63xe"><span class="svelte-ih63xe"> </span> <button class="btn-danger svelte-ih63xe">Delete Selected</button> <!> <button class="btn-secondary svelte-ih63xe">Clear Selection</button></div>`);
  var root_12 = /* @__PURE__ */ from_html(`<tr><td class="svelte-ih63xe"><input type="checkbox"/></td><td class="message-id svelte-ih63xe"> </td><td class="body-preview svelte-ih63xe"> </td><td class="svelte-ih63xe"> </td><td class="receive-count svelte-ih63xe"> </td><td class="svelte-ih63xe"> </td><td class="message-actions svelte-ih63xe"><button class="btn-small btn-danger-small svelte-ih63xe" title="Delete message">🗑️</button></td></tr>`);
  var root_13 = /* @__PURE__ */ from_html(`<div class="empty svelte-ih63xe">No messages available</div>`);
  var root_14 = /* @__PURE__ */ from_html(`<div class="pagination svelte-ih63xe"><button class="svelte-ih63xe">Previous</button> <span> </span> <button class="svelte-ih63xe">Next</button> <select class="svelte-ih63xe"><option>10 per page</option><option>25 per page</option><option>50 per page</option></select></div>`);
  var root_16 = /* @__PURE__ */ from_html(`<div class="detail-row svelte-ih63xe"><strong class="svelte-ih63xe">Message Group ID:</strong> <span class="fifo-value svelte-ih63xe"> </span></div>`);
  var root_17 = /* @__PURE__ */ from_html(`<div class="detail-row svelte-ih63xe"><strong class="svelte-ih63xe">Message Deduplication ID:</strong> <span class="fifo-value svelte-ih63xe"> </span></div>`);
  var root_19 = /* @__PURE__ */ from_html(`<div class="attribute svelte-ih63xe"><span class="attr-key svelte-ih63xe"> </span> <span class="attr-value svelte-ih63xe"> </span></div>`);
  var root_18 = /* @__PURE__ */ from_html(`<div class="detail-row svelte-ih63xe"><strong class="svelte-ih63xe">Message Attributes:</strong> <div class="attributes svelte-ih63xe"></div></div>`);
  var root_15 = /* @__PURE__ */ from_html(`<div class="message-details svelte-ih63xe"><div class="details-header svelte-ih63xe"><h3 class="svelte-ih63xe">Message Details</h3> <button class="btn-close svelte-ih63xe">×</button></div> <div class="details-content svelte-ih63xe"><div class="detail-row svelte-ih63xe"><strong class="svelte-ih63xe">Message ID:</strong> <span> </span></div> <div class="detail-row svelte-ih63xe"><strong class="svelte-ih63xe">Receipt Handle:</strong> <span class="monospace svelte-ih63xe"> </span></div> <!> <!> <!> <div class="detail-row svelte-ih63xe"><strong class="svelte-ih63xe">Body:</strong> <pre class="body-content svelte-ih63xe"> </pre></div></div></div>`);
  var root_2$1 = /* @__PURE__ */ from_html(
    `<div class="controls svelte-ih63xe"><div class="control-group svelte-ih63xe"><label class="svelte-ih63xe">Visibility (s): <input type="number" min="0" max="43200" class="input-small svelte-ih63xe"/></label> <label class="svelte-ih63xe">Wait Time (s): <input type="number" min="0" max="20" class="input-small svelte-ih63xe"/></label> <label class="checkbox-label svelte-ih63xe" title="Immediately reset visibility timeout to 0 so message stays available for other consumers"><input type="checkbox" class="svelte-ih63xe"/> Peek Mode (keep available)</label> <button class="btn-primary poll-button svelte-ih63xe"> </button> <!> <button class="btn-secondary svelte-ih63xe"> </button></div> <div class="message-count svelte-ih63xe"> </div></div> <!> <div class="info-banner svelte-ih63xe">💡 <strong class="svelte-ih63xe">Poll for Messages:</strong> <strong class="svelte-ih63xe">Receive Once:</strong> Gets a single batch. Messages are deduplicated
            by ID. <strong class="svelte-ih63xe">Peek Mode:</strong> Immediately resets visibility timeout to 0.</div> <!> <!> <!> <!> <!> <!> <div class="table-container svelte-ih63xe"><table class="svelte-ih63xe"><thead class="svelte-ih63xe"><tr><th class="svelte-ih63xe"><input type="checkbox"/></th><th class="svelte-ih63xe">Message ID</th><th class="svelte-ih63xe">Body Preview</th><th class="svelte-ih63xe">Timestamp</th><th class="svelte-ih63xe">Receive Count</th><th class="svelte-ih63xe">Attributes</th><th class="svelte-ih63xe">Actions</th></tr></thead><tbody class="svelte-ih63xe"></tbody></table> <!></div> <!> <!> <!>`,
    1
  );
  var root$1 = /* @__PURE__ */ from_html(`<div class="message-table svelte-ih63xe"><div class="tabs-container svelte-ih63xe"><div class="tabs svelte-ih63xe"><button data-testid="tab-queue">📊 Queue Info</button> <button data-testid="tab-main"> </button> <button data-testid="tab-dlq"> </button></div></div> <!></div>`);
  function MessageTableExtension($$anchor, $$props) {
    push($$props, true);
    let loading = /* @__PURE__ */ state(false);
    let error = /* @__PURE__ */ state(null);
    let selectedMessage = /* @__PURE__ */ state(null);
    let currentPage = /* @__PURE__ */ state(1);
    let pageSize = /* @__PURE__ */ state(10);
    let maxMessages = 10;
    let visibilityTimeout = /* @__PURE__ */ state(
      0
      // Default to 0 for extension (peek mode)
    );
    let waitTimeSeconds = /* @__PURE__ */ state(
      0
      // Short polling by default for better UI responsiveness
    );
    let peek = /* @__PURE__ */ state(
      true
      // Enabled by default as it's the desired behavior for this tool
    );
    let activeTab = /* @__PURE__ */ user_derived(() => store.activeTab);
    let polling = /* @__PURE__ */ state(false);
    let pollCount = /* @__PURE__ */ state(0);
    let pollProgress = /* @__PURE__ */ state(0);
    let pollDuration = 120;
    let hasLoadedMain = /* @__PURE__ */ state(false);
    let hasLoadedDlq = /* @__PURE__ */ state(false);
    let confirmDelete = /* @__PURE__ */ state(false);
    let confirmDeleteSingle = /* @__PURE__ */ state(null);
    let confirmRedrive = /* @__PURE__ */ state(false);
    let successMessage = /* @__PURE__ */ state(null);
    const paginatedMessages = /* @__PURE__ */ user_derived(() => {
      const messages = get(activeTab) === "main" ? store.messages : store.dlqMessages;
      const start = (get(currentPage) - 1) * get(pageSize);
      return messages.slice(start, start + get(pageSize));
    });
    const totalPages = /* @__PURE__ */ user_derived(() => {
      const messages = get(activeTab) === "main" ? store.messages : store.dlqMessages;
      return Math.ceil(messages.length / get(pageSize));
    });
    const totalMessages = /* @__PURE__ */ user_derived(() => {
      return get(activeTab) === "main" ? store.messages.length : store.dlqMessages.length;
    });
    const allSelected = /* @__PURE__ */ user_derived(() => {
      if (get(paginatedMessages).length === 0) return false;
      return get(paginatedMessages).every((m) => store.selectedMessageIds.has(m.messageId));
    });
    async function loadMessages() {
      if (!store.selectedQueue) return;
      if (get(loading)) return;
      try {
        set(loading, true);
        set(error, null);
        if (get(activeTab) === "main") {
          const messages = await api.receiveMessages(store.selectedQueue.id, {
            maxMessages,
            visibilityTimeout: get(visibilityTimeout),
            waitTimeSeconds: get(waitTimeSeconds),
            peek: get(peek)
          });
          const uniqueMessages = Array.from(new Map(messages.map((m) => [m.messageId, m])).values());
          store.setMessages(uniqueMessages);
        } else if (get(activeTab) === "dlq") {
          if (!store.selectedQueue.dlqUrl) {
            set(error, "No DLQ configured for this queue");
            return;
          }
          const messages = await api.receiveDlqMessages(store.selectedQueue.id, {
            maxMessages,
            visibilityTimeout: get(visibilityTimeout),
            peek: get(peek)
          });
          const uniqueMessages = Array.from(new Map(messages.map((m) => [m.messageId, m])).values());
          store.setDlqMessages(uniqueMessages);
        }
      } catch (err) {
        set(error, err instanceof Error ? err.message : "Failed to load messages", true);
      } finally {
        set(loading, false);
      }
    }
    async function pollForMessages() {
      if (!store.selectedQueue) return;
      try {
        set(polling, true);
        set(error, null);
        set(pollCount, 0);
        set(pollProgress, 0);
        if (get(activeTab) === "main") {
          store.setMessages([]);
        } else {
          store.setDlqMessages([]);
        }
        let allMessages = [];
        let seenMessageIds = /* @__PURE__ */ new Set();
        const startTime = Date.now();
        const maxDuration = pollDuration * 1e3;
        const progressInterval = setInterval(
          () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(elapsed / maxDuration * 100, 100);
            set(pollProgress, newProgress, true);
          },
          1e3
        );
        while (get(polling) && Date.now() - startTime < maxDuration) {
          update(pollCount);
          let batch;
          if (get(activeTab) === "main") {
            batch = await api.receiveMessages(store.selectedQueue.id, {
              maxMessages: 10,
              visibilityTimeout: get(visibilityTimeout),
              waitTimeSeconds: 20,
              peek: get(peek)
            });
          } else {
            if (!store.selectedQueue.dlqUrl) {
              set(error, "No DLQ configured for this queue");
              clearInterval(progressInterval);
              return;
            }
            batch = await api.receiveDlqMessages(store.selectedQueue.id, {
              maxMessages: 10,
              visibilityTimeout: get(visibilityTimeout),
              peek: get(peek)
            });
          }
          if (batch.length > 0) {
            const newMessages = batch.filter((msg) => {
              if (seenMessageIds.has(msg.messageId)) {
                return false;
              }
              seenMessageIds.add(msg.messageId);
              return true;
            });
            if (newMessages.length > 0) {
              allMessages = [...allMessages, ...newMessages];
              if (get(activeTab) === "main") {
                store.setMessages(allMessages);
              } else {
                store.setDlqMessages(allMessages);
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        clearInterval(progressInterval);
        set(pollProgress, 100);
        if (allMessages.length === 0) {
          set(error, "No messages found in the queue");
        }
      } catch (err) {
        set(error, err instanceof Error ? err.message : "Failed to poll messages", true);
      } finally {
        set(polling, false);
        set(pollCount, 0);
        set(pollProgress, 0);
      }
    }
    function stopPolling() {
      set(polling, false);
    }
    async function deleteSelected() {
      if (!store.selectedQueue || store.selectedMessageIds.size === 0) return;
      set(confirmDelete, true);
    }
    async function confirmDeleteSelected() {
      if (!store.selectedQueue || store.selectedMessageIds.size === 0) return;
      const messages = get(activeTab) === "main" ? store.messages : store.dlqMessages;
      const toDelete = messages.filter((m) => store.selectedMessageIds.has(m.messageId));
      for (const msg of toDelete) {
        try {
          await api.deleteMessage(store.selectedQueue.id, msg.receiptHandle);
          if (get(activeTab) === "main") {
            store.removeMessage(msg.receiptHandle);
          } else {
            store.setDlqMessages(store.dlqMessages.filter((m) => m.receiptHandle !== msg.receiptHandle));
          }
        } catch (err) {
          console.error(`Failed to delete message ${msg.messageId}:`, err);
        }
      }
      set(successMessage, "The selected messages were deleted successfully");
      setTimeout(() => set(successMessage, null), 5e3);
      store.clearSelection();
      set(confirmDelete, false);
    }
    async function confirmDeleteSingleMessage() {
      if (!store.selectedQueue || !get(confirmDeleteSingle)) return;
      try {
        await api.deleteMessage(store.selectedQueue.id, get(confirmDeleteSingle));
        if (get(activeTab) === "main") {
          store.removeMessage(get(confirmDeleteSingle));
        } else {
          store.setDlqMessages(store.dlqMessages.filter((m) => m.receiptHandle !== get(confirmDeleteSingle)));
        }
        set(successMessage, "Message deleted successfully");
        setTimeout(() => set(successMessage, null), 1e4);
        set(confirmDeleteSingle, null);
      } catch (err) {
        set(error, err instanceof Error ? err.message : "Failed to delete message", true);
      }
    }
    function cancelDelete() {
      set(confirmDelete, false);
    }
    async function redriveSelected() {
      console.log("[Webview] redriveSelected called");
      console.log("[Webview] selectedQueue:", store.selectedQueue);
      console.log("[Webview] selectedMessageIds.size:", store.selectedMessageIds.size);
      if (!store.selectedQueue || store.selectedMessageIds.size === 0) {
        console.log("[Webview] Aborting: no queue or no messages selected");
        return;
      }
      console.log("[Webview] Setting confirmRedrive = true");
      set(confirmRedrive, true);
    }
    async function confirmRedriveSelected() {
      console.log("[Webview] confirmRedriveSelected called");
      console.log("[Webview] selectedQueue:", store.selectedQueue);
      console.log("[Webview] selectedMessageIds:", Array.from(store.selectedMessageIds));
      if (!store.selectedQueue || store.selectedMessageIds.size === 0) {
        console.log("[Webview] Aborting: no queue or no messages selected");
        return;
      }
      try {
        set(loading, true);
        set(error, null);
        set(successMessage, null);
        set(confirmRedrive, false);
        const selectedMessages = store.dlqMessages.filter((m) => store.selectedMessageIds.has(m.messageId)).map((m) => ({
          messageId: m.messageId,
          receiptHandle: m.receiptHandle,
          body: m.body,
          messageAttributes: m.messageAttributes,
          attributes: m.attributes
        }));
        console.log("[Webview] Calling api.redriveSelectedMessages with:", {
          queueId: store.selectedQueue.id,
          messageCount: selectedMessages.length
        });
        const result = await api.redriveSelectedMessages(store.selectedQueue.id, selectedMessages);
        console.log("[Webview] Redrive result:", result);
        if (result.successCount === 0 && result.failureCount > 0) {
          set(error, `Failed to redrive all ${result.failureCount} message(s). ${result.failed.map((f) => `${f.messageId}: ${f.error}`).join("; ")}`);
        } else if (result.failureCount === 0) {
          set(successMessage, `Successfully redriven ${result.successCount} message(s)`);
          setTimeout(() => set(successMessage, null), 5e3);
        } else {
          set(successMessage, `Successfully redriven ${result.successCount} of ${result.processedCount} message(s). ${result.failureCount} failed.`);
          setTimeout(() => set(successMessage, null), 5e3);
          if (result.failed.length > 0) {
            set(error, `Failed messages: ${result.failed.map((f) => `${f.messageId}: ${f.error}`).join("; ")}`);
          }
        }
        if (result.succeeded.length > 0) {
          const succeededIds = new Set(result.succeeded.map((s) => s.messageId));
          store.setDlqMessages(store.dlqMessages.filter((m) => !succeededIds.has(m.messageId)));
          succeededIds.forEach((id) => store.selectedMessageIds.delete(id));
          store.selectedMessageIds = new Set(store.selectedMessageIds);
        }
        if (result.failureCount === 0) {
          store.clearSelection();
        }
      } catch (err) {
        set(error, err instanceof Error ? err.message : "Failed to redrive messages", true);
      } finally {
        set(loading, false);
      }
    }
    function cancelRedrive() {
      set(confirmRedrive, false);
    }
    function toggleSelectAll() {
      if (get(allSelected)) {
        get(paginatedMessages).forEach((m) => store.selectedMessageIds.delete(m.messageId));
      } else {
        get(paginatedMessages).forEach((m) => store.selectedMessageIds.add(m.messageId));
      }
      store.selectedMessageIds = new Set(store.selectedMessageIds);
    }
    function formatTimestamp(timestamp) {
      return new Date(parseInt(timestamp)).toLocaleString();
    }
    function truncate(text, length) {
      return text.length > length ? text.substring(0, length) + "..." : text;
    }
    function switchTab(tab) {
      store.setActiveTab(tab);
      set(currentPage, 1);
      store.clearSelection();
    }
    user_effect(() => {
      if (!store.selectedQueue) return;
      if (get(activeTab) === "main" && !get(hasLoadedMain) && store.messages.length === 0 && !get(loading)) {
        set(hasLoadedMain, true);
        loadMessages();
      }
      if (get(activeTab) === "dlq" && !get(hasLoadedDlq) && store.dlqMessages.length === 0 && !get(loading)) {
        set(hasLoadedDlq, true);
        loadMessages();
      }
    });
    var div = root$1();
    var div_1 = child(div);
    var div_2 = child(div_1);
    var button = child(div_2);
    let classes;
    var button_1 = sibling(button, 2);
    let classes_1;
    var text_1 = child(button_1);
    var button_2 = sibling(button_1, 2);
    let classes_2;
    var text_2 = child(button_2);
    var node = sibling(div_1, 2);
    {
      var consequent = ($$anchor2) => {
        QueueDetailsExtension($$anchor2, {});
      };
      var alternate = ($$anchor2) => {
        var fragment_1 = root_2$1();
        var div_3 = first_child(fragment_1);
        var div_4 = child(div_3);
        var label = child(div_4);
        var input = sibling(child(label));
        var label_1 = sibling(label, 2);
        var input_1 = sibling(child(label_1));
        var label_2 = sibling(label_1, 2);
        var input_2 = child(label_2);
        var button_3 = sibling(label_2, 2);
        var text_3 = child(button_3);
        var node_1 = sibling(button_3, 2);
        {
          var consequent_1 = ($$anchor3) => {
            var button_4 = root_3$1();
            delegated("click", button_4, stopPolling);
            append($$anchor3, button_4);
          };
          if_block(node_1, ($$render) => {
            if (get(polling)) $$render(consequent_1);
          });
        }
        var button_5 = sibling(node_1, 2);
        var text_4 = child(button_5);
        var div_5 = sibling(div_4, 2);
        var text_5 = child(div_5);
        var node_2 = sibling(div_3, 2);
        {
          var consequent_2 = ($$anchor3) => {
            var div_6 = root_4();
            var div_7 = child(div_6);
            var div_8 = child(div_7);
            var div_9 = sibling(div_7, 2);
            var text_6 = child(div_9);
            template_effect(
              ($0) => {
                set_style(div_8, `width: ${get(pollProgress) ?? ""}%`);
                set_text(text_6, `Polling for messages... ${$0 ?? ""}% complete
                    (${get(totalMessages) ?? ""} found so far)`);
              },
              [() => Math.round(get(pollProgress))]
            );
            append($$anchor3, div_6);
          };
          if_block(node_2, ($$render) => {
            if (get(polling)) $$render(consequent_2);
          });
        }
        var div_10 = sibling(node_2, 2);
        var text_7 = sibling(child(div_10), 2);
        text_7.nodeValue = " Continuously receives for up\n            to 120s (like AWS Console). ";
        var node_3 = sibling(div_10, 2);
        {
          var consequent_3 = ($$anchor3) => {
            var div_11 = root_5();
            var text_8 = child(div_11);
            template_effect(() => set_text(text_8, get(error)));
            append($$anchor3, div_11);
          };
          if_block(node_3, ($$render) => {
            if (get(error)) $$render(consequent_3);
          });
        }
        var node_4 = sibling(node_3, 2);
        {
          var consequent_4 = ($$anchor3) => {
            var div_12 = root_6();
            var text_9 = child(div_12);
            template_effect(() => set_text(text_9, get(successMessage)));
            append($$anchor3, div_12);
          };
          if_block(node_4, ($$render) => {
            if (get(successMessage)) $$render(consequent_4);
          });
        }
        var node_5 = sibling(node_4, 2);
        {
          var consequent_5 = ($$anchor3) => {
            var div_13 = root_7();
            var div_14 = child(div_13);
            var p = child(div_14);
            var text_10 = child(p);
            var div_15 = sibling(p, 2);
            var button_6 = child(div_15);
            var button_7 = sibling(button_6, 2);
            template_effect(() => set_text(text_10, `Delete ${store.selectedMessageIds.size ?? ""} selected message(s)?`));
            delegated("click", button_6, confirmDeleteSelected);
            delegated("click", button_7, cancelDelete);
            append($$anchor3, div_13);
          };
          if_block(node_5, ($$render) => {
            if (get(confirmDelete)) $$render(consequent_5);
          });
        }
        var node_6 = sibling(node_5, 2);
        {
          var consequent_6 = ($$anchor3) => {
            var div_16 = root_8();
            var div_17 = child(div_16);
            var div_18 = sibling(child(div_17), 2);
            var button_8 = child(div_18);
            var button_9 = sibling(button_8, 2);
            delegated("click", button_8, confirmDeleteSingleMessage);
            delegated("click", button_9, () => set(confirmDeleteSingle, null));
            append($$anchor3, div_16);
          };
          if_block(node_6, ($$render) => {
            if (get(confirmDeleteSingle)) $$render(consequent_6);
          });
        }
        var node_7 = sibling(node_6, 2);
        {
          var consequent_7 = ($$anchor3) => {
            var div_19 = root_9();
            var div_20 = child(div_19);
            var p_1 = child(div_20);
            var text_11 = child(p_1);
            var div_21 = sibling(p_1, 2);
            var button_10 = child(div_21);
            var text_12 = child(button_10);
            var button_11 = sibling(button_10, 2);
            template_effect(() => {
              set_text(text_11, `Redrive ${store.selectedMessageIds.size ?? ""} selected message(s)?`);
              button_10.disabled = get(loading);
              set_text(text_12, get(loading) ? "Processing..." : "Redrive");
              button_11.disabled = get(loading);
            });
            delegated("click", button_10, confirmRedriveSelected);
            delegated("click", button_11, cancelRedrive);
            append($$anchor3, div_19);
          };
          if_block(node_7, ($$render) => {
            if (get(confirmRedrive)) $$render(consequent_7);
          });
        }
        var node_8 = sibling(node_7, 2);
        {
          var consequent_9 = ($$anchor3) => {
            var div_22 = root_10();
            var span = child(div_22);
            var text_13 = child(span);
            var button_12 = sibling(span, 2);
            var node_9 = sibling(button_12, 2);
            {
              var consequent_8 = ($$anchor4) => {
                var button_13 = root_11();
                delegated("click", button_13, redriveSelected);
                append($$anchor4, button_13);
              };
              if_block(node_9, ($$render) => {
                if (get(activeTab) === "dlq") $$render(consequent_8);
              });
            }
            var button_14 = sibling(node_9, 2);
            template_effect(() => set_text(text_13, `${store.selectedMessageIds.size ?? ""} selected`));
            delegated("click", button_12, deleteSelected);
            delegated("click", button_14, () => store.clearSelection());
            append($$anchor3, div_22);
          };
          if_block(node_8, ($$render) => {
            if (store.selectedMessageIds.size > 0) $$render(consequent_9);
          });
        }
        var div_23 = sibling(node_8, 2);
        var table = child(div_23);
        var thead = child(table);
        var tr = child(thead);
        var th = child(tr);
        var input_3 = child(th);
        var tbody = sibling(thead);
        each(tbody, 21, () => get(paginatedMessages), (message) => message.messageId, ($$anchor3, message) => {
          var tr_1 = root_12();
          let classes_3;
          var td = child(tr_1);
          var input_4 = child(td);
          var td_1 = sibling(td);
          var text_14 = child(td_1);
          var td_2 = sibling(td_1);
          var text_15 = child(td_2);
          var td_3 = sibling(td_2);
          var text_16 = child(td_3);
          var td_4 = sibling(td_3);
          var text_17 = child(td_4);
          var td_5 = sibling(td_4);
          var text_18 = child(td_5);
          var td_6 = sibling(td_5);
          var button_15 = child(td_6);
          template_effect(
            ($0, $1, $2, $3, $4, $5) => {
              set_attribute(tr_1, "data-receipt-handle", get(message).receiptHandle);
              classes_3 = set_class(tr_1, 1, "svelte-ih63xe", null, classes_3, $0);
              set_checked(input_4, $1);
              set_text(text_14, $2);
              set_text(text_15, $3);
              set_text(text_16, $4);
              set_text(text_17, get(message).attributes.ApproximateReceiveCount ?? "0");
              set_text(text_18, $5);
            },
            [
              () => ({
                selected: store.selectedMessageIds.has(get(message).messageId)
              }),
              () => store.selectedMessageIds.has(get(message).messageId),
              () => truncate(get(message).messageId, 20),
              () => truncate(get(message).body, 50),
              () => get(message).attributes.SentTimestamp ? formatTimestamp(get(message).attributes.SentTimestamp) : "N/A",
              () => Object.keys(get(message).messageAttributes || {}).length
            ]
          );
          delegated("click", tr_1, () => set(selectedMessage, get(message), true));
          delegated("click", td, (e) => e.stopPropagation());
          delegated("change", input_4, () => store.toggleMessageSelection(get(message).messageId));
          delegated("click", button_15, (e) => {
            e.stopPropagation();
            set(confirmDeleteSingle, get(message).receiptHandle, true);
          });
          append($$anchor3, tr_1);
        });
        var node_10 = sibling(table, 2);
        {
          var consequent_10 = ($$anchor3) => {
            var div_24 = root_13();
            append($$anchor3, div_24);
          };
          if_block(node_10, ($$render) => {
            if (get(paginatedMessages).length === 0) $$render(consequent_10);
          });
        }
        var node_11 = sibling(div_23, 2);
        {
          var consequent_11 = ($$anchor3) => {
            var div_25 = root_14();
            var button_16 = child(div_25);
            var span_1 = sibling(button_16, 2);
            var text_19 = child(span_1);
            var button_17 = sibling(span_1, 2);
            var select = sibling(button_17, 2);
            var option = child(select);
            option.value = option.__value = 10;
            var option_1 = sibling(option);
            option_1.value = option_1.__value = 25;
            var option_2 = sibling(option_1);
            option_2.value = option_2.__value = 50;
            template_effect(() => {
              button_16.disabled = get(currentPage) === 1;
              set_text(text_19, `Page ${get(currentPage) ?? ""} of ${get(totalPages) ?? ""}`);
              button_17.disabled = get(currentPage) === get(totalPages);
            });
            delegated("click", button_16, () => set(currentPage, Math.max(1, get(currentPage) - 1), true));
            delegated("click", button_17, () => set(currentPage, Math.min(get(totalPages), get(currentPage) + 1), true));
            delegated("change", select, () => set(currentPage, 1));
            bind_select_value(select, () => get(pageSize), ($$value) => set(pageSize, $$value));
            append($$anchor3, div_25);
          };
          if_block(node_11, ($$render) => {
            if (get(totalPages) > 1) $$render(consequent_11);
          });
        }
        var node_12 = sibling(node_11, 2);
        {
          var consequent_15 = ($$anchor3) => {
            var div_26 = root_15();
            var div_27 = child(div_26);
            var button_18 = sibling(child(div_27), 2);
            var div_28 = sibling(div_27, 2);
            var div_29 = child(div_28);
            var span_2 = sibling(child(div_29), 2);
            var text_20 = child(span_2);
            var div_30 = sibling(div_29, 2);
            var span_3 = sibling(child(div_30), 2);
            var text_21 = child(span_3);
            var node_13 = sibling(div_30, 2);
            {
              var consequent_12 = ($$anchor4) => {
                var div_31 = root_16();
                var span_4 = sibling(child(div_31), 2);
                var text_22 = child(span_4);
                template_effect(() => set_text(text_22, get(selectedMessage).attributes.MessageGroupId));
                append($$anchor4, div_31);
              };
              if_block(node_13, ($$render) => {
                if (get(selectedMessage).attributes?.MessageGroupId) $$render(consequent_12);
              });
            }
            var node_14 = sibling(node_13, 2);
            {
              var consequent_13 = ($$anchor4) => {
                var div_32 = root_17();
                var span_5 = sibling(child(div_32), 2);
                var text_23 = child(span_5);
                template_effect(() => set_text(text_23, get(selectedMessage).attributes.MessageDeduplicationId));
                append($$anchor4, div_32);
              };
              if_block(node_14, ($$render) => {
                if (get(selectedMessage).attributes?.MessageDeduplicationId) $$render(consequent_13);
              });
            }
            var node_15 = sibling(node_14, 2);
            {
              var consequent_14 = ($$anchor4) => {
                var div_33 = root_18();
                var div_34 = sibling(child(div_33), 2);
                each(div_34, 21, () => Object.entries(get(selectedMessage).messageAttributes), index, ($$anchor5, $$item) => {
                  var $$array = /* @__PURE__ */ user_derived(() => to_array(get($$item), 2));
                  let key = () => get($$array)[0];
                  let value = () => get($$array)[1];
                  var div_35 = root_19();
                  var span_6 = child(div_35);
                  var text_24 = child(span_6);
                  var span_7 = sibling(span_6, 2);
                  var text_25 = child(span_7);
                  template_effect(() => {
                    set_text(text_24, `${key() ?? ""}:`);
                    set_text(text_25, value().stringValue || value().binaryValue || "N/A");
                  });
                  append($$anchor5, div_35);
                });
                append($$anchor4, div_33);
              };
              var d = /* @__PURE__ */ user_derived(() => get(selectedMessage).messageAttributes && Object.keys(get(selectedMessage).messageAttributes).length > 0);
              if_block(node_15, ($$render) => {
                if (get(d)) $$render(consequent_14);
              });
            }
            var div_36 = sibling(node_15, 2);
            var pre = sibling(child(div_36), 2);
            var text_26 = child(pre);
            template_effect(() => {
              set_text(text_20, get(selectedMessage).messageId);
              set_text(text_21, get(selectedMessage).receiptHandle);
              set_text(text_26, get(selectedMessage).body);
            });
            delegated("click", button_18, () => set(selectedMessage, null));
            append($$anchor3, div_26);
          };
          if_block(node_12, ($$render) => {
            if (get(selectedMessage)) $$render(consequent_15);
          });
        }
        var node_16 = sibling(node_12, 2);
        MessageComposerExtension(node_16, {});
        template_effect(() => {
          button_3.disabled = get(loading) || get(polling);
          set_text(text_3, get(polling) ? `Polling... (${get(pollCount)} calls)` : "🔄 Poll for Messages");
          button_5.disabled = get(loading) || get(polling);
          set_text(text_4, get(loading) ? "Loading..." : "Receive Once");
          set_text(text_5, `Showing ${get(paginatedMessages).length ?? ""} of ${get(totalMessages) ?? ""} received`);
          set_checked(input_3, get(allSelected));
        });
        bind_value(input, () => get(visibilityTimeout), ($$value) => set(visibilityTimeout, $$value));
        bind_value(input_1, () => get(waitTimeSeconds), ($$value) => set(waitTimeSeconds, $$value));
        bind_checked(input_2, () => get(peek), ($$value) => set(peek, $$value));
        delegated("click", button_3, pollForMessages);
        delegated("click", button_5, loadMessages);
        delegated("change", input_3, toggleSelectAll);
        append($$anchor2, fragment_1);
      };
      if_block(node, ($$render) => {
        if (get(activeTab) === "queue") $$render(consequent);
        else $$render(alternate, false);
      });
    }
    template_effect(() => {
      classes = set_class(button, 1, "svelte-ih63xe", null, classes, { active: get(activeTab) === "queue" });
      classes_1 = set_class(button_1, 1, "svelte-ih63xe", null, classes_1, { active: get(activeTab) === "main" });
      set_text(text_1, `📬 Main Queue (${store.messages.length ?? ""})`);
      button_2.disabled = !store.hasDLQ;
      classes_2 = set_class(button_2, 1, "svelte-ih63xe", null, classes_2, { active: get(activeTab) === "dlq" });
      set_text(text_2, `⚠️ DLQ (${store.dlqMessages.length ?? ""})`);
    });
    delegated("click", button, () => switchTab("queue"));
    delegated("click", button_1, () => switchTab("main"));
    delegated("click", button_2, () => switchTab("dlq"));
    append($$anchor, div);
    pop();
  }
  delegate(["click", "change"]);
  var root_2 = /* @__PURE__ */ from_html(`<div class="placeholder svelte-1cgheqj"><p>Loading queue information...</p></div>`);
  var root_3 = /* @__PURE__ */ from_html(`<div class="toast error svelte-1cgheqj"> <button class="svelte-1cgheqj">×</button></div>`);
  var root = /* @__PURE__ */ from_html(`<div class="app-extension svelte-1cgheqj"><!> <!></div>`);
  function AppExtension($$anchor, $$props) {
    push($$props, false);
    init$1();
    var div = root();
    var node = child(div);
    {
      var consequent = ($$anchor2) => {
        MessageTableExtension($$anchor2, {});
      };
      var alternate = ($$anchor2) => {
        var div_1 = root_2();
        append($$anchor2, div_1);
      };
      if_block(node, ($$render) => {
        if (store.selectedQueue) $$render(consequent);
        else $$render(alternate, false);
      });
    }
    var node_1 = sibling(node, 2);
    {
      var consequent_1 = ($$anchor2) => {
        var div_2 = root_3();
        var text = child(div_2);
        var button = sibling(text);
        template_effect(() => set_text(text, `${store.error ?? ""} `));
        delegated("click", button, () => store.clearError());
        append($$anchor2, div_2);
      };
      if_block(node_1, ($$render) => {
        if (store.error) $$render(consequent_1);
      });
    }
    append($$anchor, div);
    pop();
  }
  delegate(["click"]);
  function init() {
    if (window.initialQueue) {
      store.selectQueue(window.initialQueue);
    }
    const appElement = document.getElementById("app");
    if (!appElement) {
      document.body.innerHTML = '<h1 style="color: red;">ERROR: Could not find #app element</h1>';
      return;
    }
    try {
      mount(AppExtension, {
        target: appElement
      });
    } catch (error) {
      appElement.innerHTML = `<h1 style="color: red;">ERROR: ${error}</h1><pre>${error instanceof Error ? error.stack : ""}</pre>`;
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
//# sourceMappingURL=bundle.js.map
