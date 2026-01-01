(() => {
    const chrome = { runtime: { getURL: s => s, sendMessage: () => { }, onMessage: { addListener: () => { } } } };
    window.draggerToggle = (val) => toggleSelectionMode(val);
    let selectionMode = false;
    let hoveredElement = null;
    let currentElement = null;
    let editorPanel = null;
    let activeTab = "Layout";
    let editorWidth = 320;

    // Persistence Store
    let styleHistory = [];
    let styleHistoryIndex = -1;
    let originalStates = new Map(); // Store original styles per element reference
    let disabledClasses = new Map(); // Store Set of disabled classes per element
    let manualClasses = new Map(); // Store Set of classes added by user per element
    let selectionHelper = null;

    const ICONS = {
        pointer: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>',
        all: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
        top: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="21" y2="3"></line><rect x="3" y="7" width="18" height="14" rx="2" ry="2" opacity="0.2"></rect></svg>',
        bottom: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"></line><rect x="3" y="3" width="18" height="14" rx="2" ry="2" opacity="0.2"></rect></svg>',
        left: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="3" y2="21"></line><rect x="7" y="3" width="14" height="18" rx="2" ry="2" opacity="0.2"></rect></svg>',
        right: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="3" x2="21" y2="21"></line><rect x="3" y="3" width="14" height="18" rx="2" ry="2" opacity="0.2"></rect></svg>',
        undo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>',
        redo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path></svg>',
        reset: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 2v6h6"></path><path d="M2.66 15.57a10 10 0 1 0 .57-8.38L2.5 8"></path></svg>',
        eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
        bold: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>',
        italic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
        underline: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>',
        alignLeft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>',
        alignCenter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>',
        alignRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>',
        alignJustify: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>',
        link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
        copy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
    };

    const DISPLAY_OPTIONS = ["block", "inline", "inline-block", "flex", "inline-flex", "grid", "none"];
    const WEIGHT_OPTIONS = ["100", "200", "300", "400", "500", "600", "700", "800", "900", "normal", "bold"];
    const FONT_OPTIONS = ["Inter", "system-ui", "Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Impact"];
    const POSITION_OPTIONS = ["static", "relative", "absolute", "fixed", "sticky"];
    const CURSOR_OPTIONS = ["default", "pointer", "text", "move", "grab", "grabbing", "not-allowed", "wait", "crosshair", "help", "zoom-in", "zoom-out", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize"];
    const BOX_SIZING_OPTIONS = ["content-box", "border-box"];
    const TEXT_ALIGN_OPTIONS = ["left", "center", "right", "justify"];
    const TEXT_DECORATION_OPTIONS = ["none", "line-through", "overline"];
    const FLEX_DIRECTION_OPTIONS = ["row", "row-reverse", "column", "column-reverse"];
    const FLEX_WRAP_OPTIONS = ["nowrap", "wrap", "wrap-reverse"];
    const JUSTIFY_CONTENT_OPTIONS = ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"];
    const ALIGN_ITEMS_OPTIONS = ["stretch", "flex-start", "flex-end", "center", "baseline"];
    const ALIGN_CONTENT_OPTIONS = ["stretch", "flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"];
    const JUSTIFY_ITEMS_OPTIONS = ["stretch", "start", "end", "center"];
    const TABS = ["Layout", "Display", "Typography", "Borders", "Spacing", "Transform", "Position", "HTML"];

    // --- State & Selection ---
    // chrome.runtime.onMessage.addListener((request) => {
    //    if (request.action === "toggle_selection_mode") toggleSelectionMode(!selectionMode);
    // });

    function toggleSelectionMode(state) {
        selectionMode = state;
        document.body.classList.toggle("dragger-selecting-active", selectionMode);

        // Notify background script to update badge
        // chrome.runtime.sendMessage({ action: "update_badge", active: selectionMode });

        if (!selectionHelper) {
            selectionHelper = document.createElement("div");
            selectionHelper.id = "dragger-selection-helper";

            document.body.appendChild(selectionHelper);
        }

        if (selectionMode) {
            startSelection();
            if (editorPanel) editorPanel.style.visibility = 'hidden';
            selectionHelper.classList.add("active");
        } else {
            stopSelection();
            if (editorPanel) editorPanel.style.visibility = 'visible';
            selectionHelper.classList.remove("active");
        }
        renderPanelContent(); // Refresh UI for active state
    }

    function startSelection() {
        document.body.addEventListener("mouseover", onMouseOver, true);
        document.body.addEventListener("mouseout", onMouseOut, true);
        document.body.addEventListener("click", onClick, { capture: true });
    }

    function stopSelection() {
        document.body.removeEventListener("mouseover", onMouseOver, true);
        document.body.removeEventListener("mouseout", onMouseOut, true);
        document.body.removeEventListener("click", onClick, { capture: true });
        if (hoveredElement) hoveredElement.classList.remove("dragger-highlight");
        hoveredElement = null;
    }

    function onMouseOver(e) {
        if (!selectionMode || (editorPanel && editorPanel.contains(e.target))) return;
        if (hoveredElement) hoveredElement.classList.remove("dragger-highlight");
        hoveredElement = e.target;
        hoveredElement.classList.add("dragger-highlight");
    }

    function onMouseOut(e) {
        if (hoveredElement) hoveredElement.classList.remove("dragger-highlight");
    }

    function onClick(e) {
        if (!selectionMode || (editorPanel && editorPanel.contains(e.target))) return;
        e.preventDefault(); e.stopPropagation();
        if (currentElement) currentElement.classList.remove("dragger-highlight");
        currentElement = e.target;
        currentElement.classList.add("dragger-highlight");

        // Save original state if new
        if (!originalStates.has(currentElement)) {
            originalStates.set(currentElement, currentElement.getAttribute('style') || "");
        }

        toggleSelectionMode(false);
        showEditor(currentElement, e.clientX, e.clientY);
    }

    // ---- Panel Initialization ----
    function showEditor(el, x, y) {
        if (!editorPanel) {
            editorPanel = document.createElement("div");
            editorPanel.id = "dragger-editor-panel";
            document.body.appendChild(editorPanel);

            let pX = Math.min(x + 20, window.innerWidth - 340);
            let pY = Math.min(y + 20, window.innerHeight - 420);
            editorPanel.style.left = `${Math.max(10, pX)}px`;
            editorPanel.style.top = `${Math.max(10, pY)}px`;
            editorPanel.style.width = `${editorWidth}px`;
            editorPanel.dataset.width = editorWidth;
        } else {
            editorPanel.style.visibility = 'visible';
            editorPanel.style.width = `${editorWidth}px`;
            editorPanel.dataset.width = editorWidth;
        }
        renderPanelContent();
    }

    function renderClassesSection(el) {
        if (!el) return '';
        const currentClasses = Array.from(el.classList).filter(c => !c.startsWith('dragger-'));
        const disabled = disabledClasses.get(el) || new Set();
        const manual = manualClasses.get(el) || new Set();
        const allUnique = Array.from(new Set([...currentClasses, ...disabled, ...manual]));

        return `
      <div class="dragger-classes-section" id="dragger-classes-bar">
        ${allUnique.sort().map(cls => `
          <div class="dragger-class-item ${disabled.has(cls) ? 'inactive' : ''}" data-class="${cls}">
            <span class="dragger-class-name">${cls}</span>
            ${manual.has(cls) ? `<div class="dragger-class-remove" title="Remove Class">${ICONS.trash}</div>` : ''}
          </div>
        `).join('')}
        <button class="dragger-add-class-btn" id="dragger-add-class-btn" title="Add Class">${ICONS.plus}</button>
      </div>
    `;
    }

    function renderPanelContent(forceTabScroll = false) {
        if (!editorPanel || !currentElement) return;
        const computed = window.getComputedStyle(currentElement);
        const scrollPos = editorPanel.querySelector(".panel-content")?.scrollTop || 0;
        const tabScrollLeft = editorPanel.querySelector(".dragger-tabs")?.scrollLeft || 0;
        const dropdownOpen = editorPanel?.dataset.tabDropdown === "true";

        const header = `
      <div class="dragger-resize-h dragger-resize-l" data-resize="l"></div>
      <div class="dragger-resize-h dragger-resize-r" data-resize="r"></div>
      <div class="dragger-resize-h dragger-resize-b" data-resize="b"></div>
      <div class="dragger-resize-h dragger-resize-br" data-resize="br"></div>
      <div class="panel-header" id="dragger-header">
        <h3>Style Editor</h3>
        <button class="dragger-icon-btn" id="dragger-close-btn">✕</button>
      </div>
    `;

        const actionRow = `
      <div class="dragger-action-row">
        <button class="dragger-icon-btn ${selectionMode ? 'active' : ''}" id="dragger-select-btn" title="Select Element">${ICONS.pointer}</button>
        <div style="flex:1;"></div>
        <div class="dragger-history-tools">
            <button class="dragger-icon-btn" id="dragger-undo-btn" title="Undo" ${styleHistoryIndex <= 0 ? 'disabled' : ''}>${ICONS.undo}</button>
            <button class="dragger-icon-btn" id="dragger-redo-btn" title="Redo" ${styleHistoryIndex >= styleHistory.length - 1 ? 'disabled' : ''}>${ICONS.redo}</button>
            <button class="dragger-icon-btn" id="dragger-reset-btn" title="Reset">${ICONS.reset}</button>
        </div>
      </div>
    `;

        const tabsWrapper = `
      <div class="dragger-tabs-wrapper">
        <div class="dragger-tabs">
          ${TABS.map(t => `<div class="dragger-tab-item ${activeTab === t ? 'active' : ''}" data-tab="${t}">${t}</div>`).join('')}
        </div>
        <button class="dragger-tabs-dropdown-btn" id="dragger-tabs-dropdown-btn">⋮</button>
        ${dropdownOpen ? `
        <div class="dragger-tabs-dropdown-menu">
            ${TABS.map(t => `<div class="dragger-dropdown-item ${activeTab === t ? 'active' : ''}" data-tab="${t}">${t} ${activeTab === t ? '✓' : ''}</div>`).join('')}
        </div>` : ''}
      </div>
    `;

        let content = '<div class="panel-content">';
        if (activeTab === "Layout") {
            content += `
        <div class="dragger-control-grid">
            ${renderControl({ label: "Width", prop: "width", value: computed.width, scrub: true, full: true })}
            ${renderControl({ label: "Min Width", prop: "minWidth", value: computed.minWidth, scrub: true })}
            ${renderControl({ label: "Max Width", prop: "maxWidth", value: computed.maxWidth, scrub: true })}
            
            <div style="height:4px; grid-column: span 2;"></div>

            ${renderControl({ label: "Height", prop: "height", value: computed.height, scrub: true, full: true })}
            ${renderControl({ label: "Min Height", prop: "minHeight", value: computed.minHeight, scrub: true })}
            ${renderControl({ label: "Max Height", prop: "maxHeight", value: computed.maxHeight, scrub: true })}
            
            <div style="height:4px; grid-column: span 2;"></div>

            ${renderControl({ label: "Opacity", prop: "opacity", value: computed.opacity, scrub: true })}
            ${renderControl({ label: "Box Sizing", prop: "boxSizing", value: computed.boxSizing, type: "select", options: BOX_SIZING_OPTIONS })}
            ${renderControl({ label: "Cursor", prop: "cursor", value: computed.cursor, type: "select", options: CURSOR_OPTIONS })}
            <div style="height:4px; grid-column: span 2;"></div>
            ${renderControl({ label: "Background Color", prop: "backgroundColor", value: computed.backgroundColor, type: "color-opacity", full: true })}
        </div>`;
        } else if (activeTab === "Display") {
            content += `
        <div class="dragger-control-grid">
            ${renderControl({ label: "Display", prop: "display", value: computed.display, type: "select", options: DISPLAY_OPTIONS, full: true })}
            ${(computed.display === 'flex' || computed.display === 'inline-flex') ? `
                <div style="height:4px; grid-column: span 2;"></div>
                ${renderControl({ label: "Direction", prop: "flexDirection", value: computed.flexDirection, type: "select", options: FLEX_DIRECTION_OPTIONS, full: true })}
                ${renderControl({ label: "Wrap", prop: "flexWrap", value: computed.flexWrap, type: "select", options: FLEX_WRAP_OPTIONS, full: true })}
                ${renderControl({ label: "Justify", prop: "justifyContent", value: computed.justifyContent, type: "select", options: JUSTIFY_CONTENT_OPTIONS, full: true })}
                ${renderControl({ label: "Align Items", prop: "alignItems", value: computed.alignItems, type: "select", options: ALIGN_ITEMS_OPTIONS, full: true })}
                ${renderControl({ label: "Flex", prop: "flex", value: computed.flex, full: true })}
                ${renderControl({ label: "Shrink", prop: "flexShrink", value: computed.flexShrink, scrub: true })}
                ${renderControl({ label: "Grow", prop: "flexGrow", value: computed.flexGrow, scrub: true })}
            ` : ''}
            ${(computed.display === 'grid' || computed.display === 'inline-grid') ? `
                <div style="height:4px; grid-column: span 2;"></div>
                ${renderControl({ label: "Columns", prop: "gridTemplateColumns", value: computed.gridTemplateColumns, full: true, placeholder: "1fr 1fr" })}
                ${renderControl({ label: "Rows", prop: "gridTemplateRows", value: computed.gridTemplateRows, full: true, placeholder: "auto" })}
                ${renderControl({ label: "Gap", prop: "gridGap", value: computed.gridGap, scrub: true, full: true })}
                ${renderControl({ label: "Justify Items", prop: "justifyItems", value: computed.justifyItems, type: "select", options: JUSTIFY_ITEMS_OPTIONS, full: true })}
                ${renderControl({ label: "Align Items", prop: "alignItems", value: computed.alignItems, type: "select", options: ALIGN_ITEMS_OPTIONS, full: true })}
                ${renderControl({ label: "Justify Content", prop: "justifyContent", value: computed.justifyContent, type: "select", options: JUSTIFY_CONTENT_OPTIONS, full: true })}
                ${renderControl({ label: "Align Content", prop: "alignContent", value: computed.alignContent, type: "select", options: ALIGN_CONTENT_OPTIONS, full: true })}
            ` : ''}
        </div>`;
        } else if (activeTab === "Typography") {
            const isBold = computed.fontWeight === '700' || computed.fontWeight === 'bold';
            const isItalic = computed.fontStyle === 'italic';
            const isUnderline = computed.textDecorationLine.includes('underline');
            const textAlign = computed.textAlign;

            const currentFont = getUsedFont(computed.fontFamily);
            // unique set
            const fontOptions = Array.from(new Set([currentFont, ...FONT_OPTIONS]));

            content += `
        <div class="dragger-control-grid">
            ${renderControl({ label: "Color", prop: "color", value: computed.color, type: "color-opacity", full: true })}
            ${renderControl({ label: "Font Family", prop: "fontFamily", value: currentFont, type: "select", options: fontOptions, full: true })}
            <div style="height:4px; grid-column: span 2;"></div>
            ${renderControl({ label: "Size", prop: "fontSize", value: computed.fontSize, scrub: true })}
            
            <div class="dragger-control">
                <label>Style</label>
                <div class="dragger-button-group">
                    <button class="dragger-toggle-btn ${isBold ? 'active' : ''}" data-prop="fontWeight" data-val="${isBold ? 'normal' : 'bold'}" title="Bold">${ICONS.bold}</button>
                    <button class="dragger-toggle-btn ${isItalic ? 'active' : ''}" data-prop="fontStyle" data-val="${isItalic ? 'normal' : 'italic'}" title="Italic">${ICONS.italic}</button>
                    <button class="dragger-toggle-btn ${isUnderline ? 'active' : ''}" data-prop="textDecorationLine" data-val="${isUnderline ? 'none' : 'underline'}" title="Underline">${ICONS.underline}</button>
                </div>
            </div>

            <div class="dragger-control">
                <label>Align</label>
                <div class="dragger-button-group">
                    <button class="dragger-toggle-btn ${textAlign === 'left' ? 'active' : ''}" data-prop="textAlign" data-val="left" title="Left">${ICONS.alignLeft}</button>
                    <button class="dragger-toggle-btn ${textAlign === 'center' ? 'active' : ''}" data-prop="textAlign" data-val="center" title="Center">${ICONS.alignCenter}</button>
                    <button class="dragger-toggle-btn ${textAlign === 'right' ? 'active' : ''}" data-prop="textAlign" data-val="right" title="Right">${ICONS.alignRight}</button>
                    <button class="dragger-toggle-btn ${textAlign === 'justify' ? 'active' : ''}" data-prop="textAlign" data-val="justify" title="Justify">${ICONS.alignJustify}</button>
                </div>
            </div>

            ${renderControl({ label: "Decoration", prop: "textDecorationLine", value: computed.textDecorationLine, type: "select", options: TEXT_DECORATION_OPTIONS, full: true })}
            ${renderControl({ label: "Indent", prop: "textIndent", value: computed.textIndent, scrub: true, full: true })}
        </div>`;
        } else if (activeTab === "Borders") {
            content += renderBordersTab(computed);
        } else if (activeTab === "Spacing") {
            content += `
        <div style="display:flex; flex-direction:column; gap:16px;">
            ${renderVirtualBox("margin", computed)}
            ${renderVirtualBox("padding", computed)}
            <div>
                ${renderControl({ label: "Gap", prop: "gap", value: computed.gap, scrub: true, full: true })}
            </div>
        </div>`;
        } else if (activeTab === "Transform") {
            content += renderTransformTab();
        } else if (activeTab === "Position") {
            content += `
        <div class="dragger-control-grid">
            ${renderControl({ label: "Position", prop: "position", value: computed.position, type: "select", options: POSITION_OPTIONS, full: true })}
            ${renderControl({ label: "Top", prop: "top", value: computed.top, scrub: true })}
            ${renderControl({ label: "Bottom", prop: "bottom", value: computed.bottom, scrub: true })}
            ${renderControl({ label: "Left", prop: "left", value: computed.left, scrub: true })}
            ${renderControl({ label: "Right", prop: "right", value: computed.right, scrub: true })}
            ${renderControl({ label: "Z-Index", prop: "zIndex", value: computed.zIndex, scrub: true, full: true })}
        </div>`;
        } else if (activeTab === "HTML") {
            const id = currentElement.id || "";
            const name = currentElement.getAttribute('name') || "";
            const labelFor = currentElement.getAttribute('for') || "";
            const rawHtml = currentElement.outerHTML;

            content += `
        <div style="display:flex; flex-direction:column; gap:16px;">
            <div class="dragger-control">
                <label>Classes</label>
                ${renderClassesSection(currentElement)}
            </div>
            
            <div class="dragger-control-grid">
                <div class="dragger-control"><label>ID</label><input type="text" class="dragger-input dragger-attr-input" data-attr="id" value="${id}" placeholder="No ID"></div>
                ${['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(currentElement.tagName) ? `<div class="dragger-control"><label>Name</label><input type="text" class="dragger-input dragger-attr-input" data-attr="name" value="${name}" placeholder="No Name"></div>` : ''}
                ${currentElement.tagName === 'LABEL' ? `<div class="dragger-control"><label>For</label><input type="text" class="dragger-input dragger-attr-input" data-attr="for" value="${labelFor}" placeholder="No For"></div>` : ''}
            </div>

            <div class="dragger-control">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <label>Content</label>
                    <button class="dragger-icon-btn" id="dragger-copy-text-btn" title="Copy Text Content" style="padding:2px 8px; font-size:10px; height:auto;">COPY</button>
                </div>
                <textarea class="dragger-input" style="height:60px; font-size:12px; resize:none;" readonly>${currentElement.innerText || ""}</textarea>
            </div>

            <div class="dragger-control">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <label>Raw HTML</label>
                    <button class="dragger-icon-btn" id="dragger-copy-html-btn" title="Copy HTML" style="padding:2px 8px; font-size:10px; height:auto;">COPY</button>
                </div>
                <textarea class="dragger-input" style="height:120px; font-family:monospace; font-size:11px; resize:none;" readonly>${rawHtml}</textarea>
            </div>
        </div>`;
        }
        content += '</div>';

        editorPanel.innerHTML = header + actionRow + tabsWrapper + content;
        const contentArea = editorPanel.querySelector(".panel-content");
        if (contentArea) contentArea.scrollTop = scrollPos;
        const tabContainer = editorPanel.querySelector(".dragger-tabs");
        if (tabContainer) {
            if (forceTabScroll) {
                const activeItem = tabContainer.querySelector(".dragger-tab-item.active");
                if (activeItem) activeItem.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
            } else {
                tabContainer.scrollLeft = tabScrollLeft;
            }
        }
        setupInteractions();
        setupDraggable(editorPanel);
    }

    // ---- Tab Specific Renderers ----
    function renderBordersTab(computed) {
        const side = editorPanel?.dataset.borderSide || "all";
        let vals = {};
        if (side === 'all') {
            vals = { w: computed.borderWidth, s: computed.borderStyle, c: computed.borderColor, tls: computed.borderTopLeftRadius, trs: computed.borderTopRightRadius, bls: computed.borderBottomLeftRadius, brs: computed.borderBottomRightRadius };
        } else {
            const S = capitalize(side);
            vals = { w: computed[`border${S}Width`], s: computed[`border${S}Style`], c: computed[`border${S}Color`] };
        }
        const { hex, alpha } = parseColor(vals.c || "transparent");

        return `
    <div class="dragger-side-selector">
        ${['all', 'top', 'bottom', 'left', 'right'].map(s => `<div class="dragger-side-icon ${side === s ? 'active' : ''}" data-side="${s}">${ICONS[s]}</div>`).join('')}
    </div>
    <div class="dragger-control-grid">
        <div class="dragger-control"><label>Width</label><input type="text" id="dragger-border-width" name="borderWidth" class="dragger-input side-input" data-side="${side}" data-type="width" value="${formatValue(vals.w)}" data-scrub="true" placeholder="0"></div>
        <div class="dragger-control"><label>Style</label><select id="dragger-border-style" name="borderStyle" class="dragger-input side-input dragger-select" data-side="${side}" data-type="style">
            ${["none", "solid", "dashed", "dotted"].map(o => `<option value="${o}" ${vals.s === o ? 'selected' : ''}>${capitalize(o)}</option>`).join('')}
        </select></div>
        <div class="dragger-control full-width"><label>Color</label><div class="dragger-grouped-input color-group">
            <div class="dragger-color-preview-btn" style="background-color:${vals.c}"><input type="color" id="dragger-border-color-picker" name="borderColorPicker" data-side="${side}" data-type="color-hex" value="${hex}"></div>
            <input type="text" id="dragger-border-color-text" name="borderColorText" class="dragger-input side-input" data-side="${side}" data-type="color-text" value="${hex}">
            <input type="text" id="dragger-border-color-alpha" name="borderColorAlpha" class="dragger-input side-input" data-side="${side}" data-type="color-alpha" value="${alpha}%">
        </div></div>
        ${side === 'all' ? `
        <div class="dragger-control full-width"><label>Corner Radius</label>
            <div class="radius-grid">
                <div class="radius-item"><input type="text" id="dragger-border-radius-topleft" name="borderRadiusTopLeft" class="dragger-input side-input" data-side="all" data-type="radius" data-corner="TopLeft" value="${formatValue(vals.tls)}" data-scrub="true" placeholder="0"></div>
                <div class="radius-item"><input type="text" id="dragger-border-radius-topright" name="borderRadiusTopRight" class="dragger-input side-input" data-side="all" data-type="radius" data-corner="TopRight" value="${formatValue(vals.trs)}" data-scrub="true" placeholder="0"></div>
                <div class="radius-item"><input type="text" id="dragger-border-radius-bottomleft" name="borderRadiusBottomLeft" class="dragger-input side-input" data-side="all" data-type="radius" data-corner="BottomLeft" value="${formatValue(vals.bls)}" data-scrub="true" placeholder="0"></div>
                <div class="radius-item"><input type="text" id="dragger-border-radius-bottomright" name="borderRadiusBottomRight" class="dragger-input side-input" data-side="all" data-type="radius" data-corner="BottomRight" value="${formatValue(vals.brs)}" data-scrub="true" placeholder="0"></div>
            </div>
        </div>` : ''}
    </div>`;
    }

    function renderTransformTab() {
        const style = currentElement.style;
        const tx = style.transform?.match(/translateX\(([^)]+)\)/)?.[1] || "0";
        const ty = style.transform?.match(/translateY\(([^)]+)\)/)?.[1] || "0";
        const tz = style.transform?.match(/translateZ\(([^)]+)\)/)?.[1] || "0";
        const sc = style.scale || "1";
        const ro = (parseFloat(style.rotate || "0") % 360) || 0;

        const renderTransControl = (label, prop, val, presets) => `
        <div class="dragger-control full-width" style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label style="margin:0;">${label}</label>
            </div>
            <input type="text" id="dragger-trans-${prop}" name="${prop}" class="dragger-input" value="${formatValue(val)}" data-prop="${prop}" data-custom="true" data-scrub="true">
            <div class="dragger-presets">
                ${presets ? presets.map(p => `<button class="dragger-preset-btn" data-type="trans" data-prop="${prop}" data-val="${p}">${p + (p === '0' ? '' : '%')}</button>`).join('') : ''}
                <button class="dragger-preset-btn" data-type="reset-prop" data-prop="${prop}" style="margin-left:auto;">Reset</button>
            </div>
        </div>`;

        return `
    <div class="dragger-control-grid" style="grid-template-columns: 1fr;">
        ${renderTransControl("Translation X", "translateX", tx, ["0", "25", "50", "100"])}
        ${renderTransControl("Translation Y", "translateY", ty, ["0", "25", "50", "100"])}
        ${renderTransControl("Translation Z", "translateZ", tz, null)}
        <div class="dragger-control full-width">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label style="margin:0;">Scale</label>
            </div>
            <input type="text" id="dragger-transform-scale" name="scale" class="dragger-input" value="${sc}" data-prop="scale" data-custom="true" data-scrub="true">
            <div class="dragger-presets">
                <button class="dragger-preset-btn" data-type="scale" data-val="0.1">+0.1</button>
                <button class="dragger-preset-btn" data-type="scale" data-val="-0.1">-0.1</button>
                <button class="dragger-preset-btn" data-type="reset-prop" data-prop="scale" style="margin-left:auto;">Reset</button>
            </div>
        </div>
        <div class="dragger-control full-width" style="margin-top:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label style="margin:0;">Rotate (deg)</label>
            </div>
            <input type="text" id="dragger-transform-rotate" name="rotate" class="dragger-input" value="${ro}" data-prop="rotate" data-custom="true" data-scrub="true">
            <div class="dragger-presets">
                ${["0", "45", "90", "180"].map(p => `<button class="dragger-preset-btn" data-type="rotate" data-val="${p}">${p}°</button>`).join('')}
                <button class="dragger-preset-btn" data-type="reset-prop" data-prop="rotate" style="margin-left:auto;">Reset</button>
            </div>
        </div>
    </div>`;
    }

    function renderAnimationTab(computed) {
        return `
    <div class="dragger-control-grid">
        ${renderControl({ label: "Name", prop: "animationName", value: computed.animationName, full: true })}
        ${renderControl({ label: "Duration", prop: "animationDuration", value: computed.animationDuration, scrub: true })}
        ${renderControl({ label: "Timing", prop: "animationTimingFunction", value: computed.animationTimingFunction, type: "select", options: ANIMATION_TIMING_OPTIONS })}
        ${renderControl({ label: "Delay", prop: "animationDelay", value: computed.animationDelay, scrub: true })}
        ${renderControl({ label: "Iteration", prop: "animationIterationCount", value: computed.animationIterationCount, scrub: true })}
    </div>
    <div style="margin-top:16px;">
        <label style="font-size:11px; color:#666; font-weight:600; text-transform:uppercase;">Keyframes (Experimental)</label>
        <div style="margin-top:8px; display:flex; flex-direction:column; gap:8px;">
            <div style="font-size:12px; color:#888; text-align:center; padding:12px; border:1px dashed #ddd; border-radius:8px;">
                Keyframe editor implementation in progress. 
                <br>Use 'animation-name' with existing CSS rules.
            </div>
        </div>
    </div>`;
    }

    function renderControl(c) {
        let inputHtml = '';
        const id = `dragger-control-${c.prop}`;
        if (c.type === "select") {
            inputHtml = `<select id="${id}" name="${c.prop}" class="dragger-input dragger-select" data-prop="${c.prop}">${c.options.map(o => `<option value="${o}" ${c.value === o ? 'selected' : ''}>${capitalize(o)}</option>`).join('')}</select>`;
        } else if (c.type === "color-opacity") {
            const { hex, alpha } = parseColor(c.value);
            inputHtml = `<div class="dragger-grouped-input color-group">
            <div class="dragger-color-preview-btn" style="background-color:${c.value}"><input type="color" id="${id}-picker" name="${c.prop}Picker" data-prop="${c.prop}" data-type="color-hex" value="${hex}"></div>
            <input type="text" id="${id}-text" name="${c.prop}Text" class="dragger-input" data-prop="${c.prop}" data-type="color-text" value="${hex}">
            <input type="text" id="${id}-alpha" name="${c.prop}Alpha" class="dragger-input" data-prop="${c.prop}" data-type="color-alpha" value="${alpha}%">
        </div>`;
        } else {
            inputHtml = `<input type="text" id="${id}" name="${c.prop}" class="dragger-input" value="${formatValue(c.value)}" placeholder="auto" data-prop="${c.prop}" data-scrub="${c.scrub ? 'true' : 'false'}">`;
        }
        return `<div class="dragger-control ${c.full ? 'full-width' : ''}"><label>${c.label}</label>${inputHtml}</div>`;
    }

    function renderVirtualBox(base, computed) {
        const t = formatValue(computed[`${base}Top`]);
        const b = formatValue(computed[`${base}Bottom`]);
        const l = formatValue(computed[`${base}Left`]);
        const r = formatValue(computed[`${base}Right`]);
        const all = formatValue(computed[base]);

        return `
    <div class="dragger-spacing-group">
        <div class="dragger-spacing-header">
            <label>${base}</label>
        </div>
        <div class="dragger-virtual-box">
            <input type="text" id="dragger-${base}-top" name="${base}Top" class="dragger-box-label side-input top ${t ? 'active' : ''}" data-base="${base}" data-side="top" data-scrub="true" value="${t}" placeholder="0">
            <input type="text" id="dragger-${base}-bottom" name="${base}Bottom" class="dragger-box-label side-input bottom ${b ? 'active' : ''}" data-base="${base}" data-side="bottom" data-scrub="true" value="${b}" placeholder="0">
            <input type="text" id="dragger-${base}-left" name="${base}Left" class="dragger-box-label side-input left ${l ? 'active' : ''}" data-base="${base}" data-side="left" data-scrub="true" value="${l}" placeholder="0">
            <input type="text" id="dragger-${base}-right" name="${base}Right" class="dragger-box-label side-input right ${r ? 'active' : ''}" data-base="${base}" data-side="right" data-scrub="true" value="${r}" placeholder="0">
            <div class="dragger-box-inner"></div>
            <input type="text" id="dragger-${base}-all" name="${base}All" class="dragger-box-label side-input center" data-base="${base}" data-side="all" data-scrub="true" value="${all}" placeholder="0">
        </div>
    </div>`;
    }

    // ---- Logic & Helpers ----
    function saveHistory() {
        if (!currentElement) return;
        const currentStyle = currentElement.getAttribute('style') || "";
        if (styleHistory[styleHistoryIndex] === currentStyle) return;
        styleHistory = styleHistory.slice(0, styleHistoryIndex + 1);
        styleHistory.push(currentStyle);
        if (styleHistory.length > 20) styleHistory.shift();
        else styleHistoryIndex++;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        const undoBtn = editorPanel?.querySelector("#dragger-undo-btn");
        const redoBtn = editorPanel?.querySelector("#dragger-redo-btn");
        if (undoBtn) undoBtn.disabled = styleHistoryIndex <= 0;
        if (redoBtn) redoBtn.disabled = styleHistoryIndex >= styleHistory.length - 1;
    }

    function handleInputChange(e, el, immediate = true) {
        const t = e.target, p = t.dataset.prop, v = t.value;
        if (t.dataset.custom === "true") {
            const ins = editorPanel.querySelectorAll("[data-custom='true']");
            let tx = "0", ty = "0", tz = "0", sc = "1", ro = 0;
            ins.forEach(i => {
                const iv = i.value || (i.dataset.prop === 'scale' ? '1' : '0');
                if (i.dataset.prop === "translateX") tx = parseInput(iv, "translateX");
                if (i.dataset.prop === "translateY") ty = parseInput(iv, "translateY");
                if (i.dataset.prop === "translateZ") tz = parseInput(iv, "translateZ");
                if (i.dataset.prop === "scale") sc = iv;
                if (i.dataset.prop === "rotate") ro = (parseFloat(iv) || 0) % 360;
            });
            setStyle(el, 'transform', `translateX(${tx}) translateY(${ty}) translateZ(${tz})`);
            setStyle(el, 'scale', sc);
            setStyle(el, 'rotate', `${ro}deg`);
        } else if (t.dataset.type?.includes("color")) {
            const wr = t.closest(".color-group");
            const h = wr.querySelector("[data-type='color-text']").value, a = wr.querySelector("[data-type='color-alpha']").value;
            if (h.length === 7) { wr.querySelector("input[type='color']").value = h; wr.querySelector(".dragger-color-preview-btn").style.backgroundColor = h; }
            setStyle(el, p, toRgba(h, a));
        } else {
            setStyle(el, p, parseInput(v, p));
        }
        if (p === 'display') renderPanelContent();
        if (immediate) saveHistory();
    }

    function handleAttributeChange(e, el) {
        const t = e.target, a = t.dataset.attr, v = t.value;
        if (v.trim()) el.setAttribute(a, v.trim());
        else el.removeAttribute(a);
        saveHistory();
        renderPanelContent();
    }

    function setupInteractions() {
        const p = editorPanel;
        p.querySelector("#dragger-close-btn").onclick = () => { p.style.visibility = 'hidden'; selectionMode = false; };
        p.querySelector("#dragger-select-btn").onclick = () => toggleSelectionMode(true);

        const copyBtn = p.querySelector("#dragger-copy-btn");
        if (copyBtn) copyBtn.onclick = () => {
            const currStr = currentElement.getAttribute('style') || "";

            const parse = (str) => {
                return str.split(';').reduce((acc, s) => {
                    const parts = s.split(':');
                    if (parts.length >= 2) {
                        const key = parts[0].trim().toLowerCase();
                        const val = parts.slice(1).join(':').trim();
                        if (key && val) acc[key] = val;
                    }
                    return acc;
                }, {});
            };

            const curr = parse(currStr);
            const keys = Object.keys(curr);

            const tabOrder = ["Layout", "Display", "Typography", "Borders", "Spacing", "Transform", "Position"];
            const tabProps = {
                "Layout": ["width", "min-width", "max-width", "height", "min-height", "max-height", "opacity", "box-sizing", "cursor", "background-color"],
                "Display": ["display", "flex-direction", "flex-wrap", "justify-content", "align-items", "flex", "flex-shrink", "flex-grow", "grid-template-columns", "grid-template-rows", "grid-gap", "justify-items", "align-content"],
                "Typography": ["color", "font-family", "font-size", "font-weight", "font-style", "text-decoration-line", "text-align", "text-indent"],
                "Borders": ["border-width", "border-style", "border-color", "border-radius", "border-top-width", "border-top-style", "border-top-color", "border-bottom-width", "border-bottom-style", "border-bottom-color", "border-left-width", "border-left-style", "border-left-color", "border-right-width", "border-right-style", "border-right-color", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"],
                "Spacing": ["margin", "margin-top", "margin-bottom", "margin-left", "margin-right", "padding", "padding-top", "padding-bottom", "padding-left", "padding-right", "gap"],
                "Transform": ["transform", "scale", "rotate"],
                "Position": ["position", "top", "bottom", "left", "right", "z-index"]
            };

            const getScore = (key) => {
                if (key.startsWith('--')) return 2000;
                for (let i = 0; i < tabOrder.length; i++) {
                    const props = tabProps[tabOrder[i]];
                    const idx = props.indexOf(key);
                    if (idx !== -1) return (i * 100) + idx;
                }
                return 1000; // Others
            };

            keys.sort((a, b) => getScore(a) - getScore(b));

            const styleLines = keys.map(k => `  ${k}: ${curr[k]};`);
            const selector = currentElement.id ? `#${currentElement.id}` :
                (Array.from(currentElement.classList).filter(c => !c.startsWith('dragger-')).map(c => `.${c}`).join('') || '.element');

            const cssBlock = `${selector} {\n${styleLines.join('\n')}\n}`;

            navigator.clipboard.writeText(cssBlock).then(() => {
                const btn = p.querySelector("#dragger-copy-btn");
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Copied';
                setTimeout(() => btn.innerHTML = originalText, 1000);
            });
        };

        const copyHtmlBtn = p.querySelector("#dragger-copy-html-btn");
        if (copyHtmlBtn) {
            copyHtmlBtn.onclick = () => {
                const html = currentElement.outerHTML;
                navigator.clipboard.writeText(html).then(() => {
                    const original = copyHtmlBtn.innerText;
                    copyHtmlBtn.innerText = "COPIED";
                    setTimeout(() => copyHtmlBtn.innerText = original, 1000);
                });
            };
        }

        const copyTextBtn = p.querySelector("#dragger-copy-text-btn");
        if (copyTextBtn) {
            copyTextBtn.onclick = () => {
                const text = currentElement.innerText || "";
                navigator.clipboard.writeText(text).then(() => {
                    const original = copyTextBtn.innerText;
                    copyTextBtn.innerText = "COPIED";
                    setTimeout(() => copyTextBtn.innerText = original, 1000);
                });
            };
        }

        p.querySelectorAll(".dragger-attr-input").forEach(i => {
            i.onchange = (e) => handleAttributeChange(e, currentElement);
        });

        p.querySelector("#dragger-undo-btn").onclick = () => { if (styleHistoryIndex > 0) { styleHistoryIndex--; applyHistory(); } };
        p.querySelector("#dragger-redo-btn").onclick = () => { if (styleHistoryIndex < styleHistory.length - 1) { styleHistoryIndex++; applyHistory(); } };
        p.querySelector("#dragger-reset-btn").onclick = () => {
            const orig = originalStates.get(currentElement);
            if (orig !== undefined) { currentElement.setAttribute('style', orig); styleHistory = [orig]; styleHistoryIndex = 0; renderPanelContent(); }
        };
        p.querySelectorAll(".dragger-tab-item").forEach(t => t.onclick = () => { activeTab = t.dataset.tab; renderPanelContent(); });

        // Tab Dropdown Toggle
        const dropBtn = p.querySelector("#dragger-tabs-dropdown-btn");
        if (dropBtn) dropBtn.onclick = (e) => {
            e.stopPropagation();
            p.dataset.tabDropdown = p.dataset.tabDropdown === "true" ? "false" : "true";
            renderPanelContent();
        };

        // Dropdown Items
        p.querySelectorAll(".dragger-dropdown-item").forEach(item => {
            item.onclick = () => {
                activeTab = item.dataset.tab;
                p.dataset.tabDropdown = "false";
                renderPanelContent(true);
            };
        });

        // Close dropdown on click outside
        const closeDropdown = (e) => {
            if (!e.target.closest(".dragger-tabs-wrapper") && p.dataset.tabDropdown === "true") {
                p.dataset.tabDropdown = "false";
                renderPanelContent();
            }
        };
        document.addEventListener("click", closeDropdown, { once: true });

        p.querySelectorAll(".dragger-input:not(.side-input)").forEach(i => {
            i.oninput = (e) => handleInputChange(e, currentElement, false);
            i.onblur = (e) => saveHistory();
            if (i.dataset.scrub === "true") setupScrubbably(i, currentElement);
        });

        p.querySelectorAll(".dragger-preset-btn").forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type, val = btn.dataset.val, prop = btn.dataset.prop;
                if (type === 'trans') setStyle(currentElement, 'transform', (currentElement.style.transform || "").replace(new RegExp(`${prop}\\([^)]*\\)`, 'g'), "") + ` ${prop}(${val}%)`);
                else if (type === 'scale') setStyle(currentElement, 'scale', val === "1" ? "1" : (parseFloat(currentElement.style.scale || 1) + parseFloat(val)).toFixed(1));
                else if (type === 'rotate') setStyle(currentElement, 'rotate', `${val}deg`);
                else if (type === 'reset-prop') {
                    if (prop === 'scale') setStyle(currentElement, 'scale', "1");
                    else if (prop === 'rotate') setStyle(currentElement, 'rotate', "0deg");
                    else setStyle(currentElement, 'transform', (currentElement.style.transform || "").replace(new RegExp(`${prop}\\([^)]*\\)`, 'g'), "").trim());
                }
                saveHistory(); renderPanelContent();
            };
        });
        // Toggle Buttons (Bold, Italic, Underline, Align)
        p.querySelectorAll(".dragger-toggle-btn").forEach(btn => {
            btn.onclick = () => {
                const prop = btn.dataset.prop;
                const val = btn.dataset.val;

                if (prop === 'textDecorationLine') {
                    const current = window.getComputedStyle(currentElement).textDecorationLine;
                    if (val === 'underline') {
                        // Toggle underline
                        if (current.includes('underline')) {
                            setStyle(currentElement, prop, current.replace('underline', '').trim() || 'none');
                        } else {
                            setStyle(currentElement, prop, (current === 'none' ? '' : current + ' ') + 'underline');
                        }
                    } else {
                        setStyle(currentElement, prop, val);
                    }
                } else {
                    setStyle(currentElement, prop, val);
                }
                saveHistory();
                renderPanelContent();
            };
        });

        // Color Pickers
        p.querySelectorAll("input[type='color']").forEach(pk => {
            const update = () => {
                const wr = pk.closest(".color-group");
                wr.querySelector("[data-type='color-text']").value = pk.value;
                wr.querySelector(".dragger-color-preview-btn").style.backgroundColor = pk.value;
                const al = wr.querySelector("[data-type='color-alpha']").value;
                const prop = pk.dataset.prop || pk.closest('.dragger-control')?.querySelector('input')?.dataset.prop;
                setStyle(currentElement, prop, toRgba(pk.value, al));
            };
            pk.oninput = update;
            pk.onchange = () => { update(); saveHistory(); };
        });

        // Borders & Spacing
        p.querySelectorAll(".dragger-side-icon").forEach(ic => ic.onclick = () => { p.dataset.borderSide = ic.dataset.side; renderPanelContent(); });
        p.querySelectorAll(".side-input").forEach(i => {
            i.oninput = (e) => handleSideChange(e, currentElement, false);
            i.onblur = () => saveHistory();
            if (i.dataset.scrub === "true") setupScrubbably(i, currentElement, true);
        });
        // Color inputs in borders
        p.querySelectorAll(".side-input[data-type^='color']").forEach(ci => {
            ci.oninput = (e) => { handleSideChange(e, currentElement, false); };
        });

        p.querySelectorAll(".dragger-box-label").forEach(l => {
            l.oninput = (e) => handleSideChange(e, currentElement, false);
            l.onblur = () => saveHistory();
            setupScrubbably(l, currentElement, true);
        });

        // Tab Bar Drag Scroll
        const tabContainer = p.querySelector(".dragger-tabs");
        let isDraggingTabs = false, startX, scrollLeft;
        tabContainer.onmousedown = (e) => {
            isDraggingTabs = true;
            startX = e.clientX;
            scrollLeft = tabContainer.scrollLeft;
            tabContainer.style.cursor = 'grabbing';

            const onMouseMove = (me) => {
                if (!isDraggingTabs) return;
                const walk = (me.clientX - startX) * 1.5;
                tabContainer.scrollLeft = scrollLeft - walk;
            };
            const onMouseUp = () => {
                isDraggingTabs = false;
                tabContainer.style.cursor = 'pointer';
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        // Classes Bar Interactions
        const classesBar = p.querySelector("#dragger-classes-bar");
        if (classesBar) {
            classesBar.querySelectorAll(".dragger-class-item").forEach(item => {
                item.onclick = (e) => {
                    const cls = item.dataset.class;
                    const el = currentElement;
                    if (e.target.closest(".dragger-class-remove")) {
                        e.stopPropagation();
                        el.classList.remove(cls);

                        let manual = manualClasses.get(el) || new Set();
                        manual.delete(cls);
                        manualClasses.set(el, manual);

                        let disabled = disabledClasses.get(el) || new Set();
                        disabled.delete(cls);
                        disabledClasses.set(el, disabled);

                        saveHistory();
                        renderPanelContent();
                        return;
                    }

                    let disabled = disabledClasses.get(el) || new Set();
                    if (disabled.has(cls)) {
                        disabled.delete(cls);
                        el.classList.add(cls);
                    } else {
                        disabled.add(cls);
                        el.classList.remove(cls);
                    }
                    disabledClasses.set(el, disabled);
                    saveHistory();
                    renderPanelContent();
                };
            });

            const addBtn = classesBar.querySelector("#dragger-add-class-btn");
            if (addBtn) addBtn.onclick = () => {
                const input = prompt("Enter class name(s) (space separated):");
                if (input && input.trim()) {
                    const classes = input.trim().split(/\s+/);
                    let manual = manualClasses.get(currentElement) || new Set();

                    classes.forEach(c => {
                        currentElement.classList.add(c);
                        manual.add(c);
                    });

                    manualClasses.set(currentElement, manual);
                    saveHistory();
                    renderPanelContent();
                }
            };
        }

        // Resize Handle Logic
        const resizeHandle = p.querySelector("#dragger-resize-handle");
        if (resizeHandle) {
            resizeHandle.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const startWidth = p.offsetWidth;
                const startX = e.clientX;
                document.body.classList.add("dragger-resizing-active");

                const onMouseMove = (me) => {
                    const delta = me.clientX - startX;
                    editorWidth = Math.min(600, Math.max(320, startWidth + delta));
                    p.style.width = `${editorWidth}px`;
                    p.dataset.width = editorWidth;
                };

                const onMouseUp = () => {
                    document.body.classList.remove("dragger-resizing-active");
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            };
        }
    }

    function handleSideChange(e, el, immediate = true) {
        const t = e.target, s = t.dataset.side, ty = t.dataset.type, v = t.value;
        const base = t.dataset.base || 'margin';
        let finalVal = v;
        if (ty?.includes("color")) {
            const wr = t.closest(".color-group");
            finalVal = toRgba(wr.querySelector("[data-type='color-text']").value, wr.querySelector("[data-type='color-alpha']").value);
        } else if (ty === 'radius') {
            const corner = t.dataset.corner;
            setStyle(el, `border${corner}Radius`, parseInput(v, 'radius'));
            if (immediate) saveHistory(); return;
        } else {
            finalVal = parseInput(v, ty || s);
        }

        // Update current input to clean value
        t.value = formatValue(finalVal);

        if (s === 'all') {
            if (activeTab === 'Borders') {
                if (ty === 'width') setStyle(el, 'borderWidth', finalVal);
                else if (ty.includes('color')) setStyle(el, 'borderColor', finalVal);
                else if (ty === 'style') setStyle(el, 'borderStyle', finalVal);
            } else {
                setStyle(el, base, finalVal);
                // Sync individual side inputs in DOM
                ['top', 'bottom', 'left', 'right'].forEach(side => {
                    const input = editorPanel.querySelector(`#dragger-${base}-${side}`);
                    if (input) {
                        input.value = formatValue(finalVal);
                        input.classList.toggle('active', !!input.value);
                    }
                });
            }
        } else {
            const S = capitalize(s);
            if (activeTab === 'Borders') {
                if (ty === 'width') setStyle(el, `border${S}Width`, finalVal);
                else if (ty.includes('color')) setStyle(el, `border${S}Color`, finalVal);
                else if (ty === 'style') setStyle(el, `border${S}Style`, finalVal);
            } else {
                setStyle(el, `${base}${S}`, finalVal);
                // Sync the 'all' input in DOM
                const allInput = editorPanel.querySelector(`#dragger-${base}-all`);
                if (allInput) {
                    const sides = ['top', 'bottom', 'left', 'right'].map(sd => {
                        const inp = editorPanel.querySelector(`#dragger-${base}-${sd}`);
                        return inp ? inp.value.trim() : '';
                    });
                    const first = sides[0];
                    const allMatch = first !== '' && sides.every(v => v === first);
                    allInput.value = allMatch ? first : '';
                    allInput.classList.toggle('active', allMatch);
                }
            }
        }
        t.classList.toggle('active', !!t.value);
        if (immediate) saveHistory();
    }

    function applyHistory() {
        currentElement.setAttribute('style', styleHistory[styleHistoryIndex]);
        renderPanelContent();
    }

    // ---- Helpers ----
    function formatValue(v) {
        if (!v || v === 'auto' || v === 'normal' || v === 'none' || v === 'rgba(0,0,0,0)' || v === '0px') return '';
        return v.toString().replace(/px/g, '');
    }
    function parseInput(v, p) {
        if (!v || v === 'auto') return "0px";
        const clean = v.toString().replace(/px/g, '').trim();
        if (/^-?\d*\.?\d+$/.test(clean)) return ["opacity", "zIndex", "fontWeight", "lineHeight", "scale", "rotate"].includes(p) ? clean : clean + "px";
        if (p === 'textIndent' && /^-?\d*\.?\d+(?:px|em|%|rem)$/.test(v)) return v;
        return v;
    }
    function parseColor(c) {
        if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') return { hex: "#000000", alpha: "0" };
        if (c.startsWith("#")) return { hex: c, alpha: "100" };
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return { hex: "#000000", alpha: "100" };
        return { hex: "#" + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join(""), alpha: Math.round((m[4] ? parseFloat(m[4]) : 1) * 100) };
    }
    function toRgba(h, a) { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return `rgba(${r},${g},${b},${(parseInt(a) || 100) / 100})`; }
    function setStyle(el, prop, val) {
        if (!el || !prop) return;
        const kebab = prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
        el.style.setProperty(kebab, val, 'important');
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function setupScrubbably(input, el, isSpacing = false) {
        let startX, startVal, timer, scrubActive = false;
        input.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            startX = e.clientX;
            startVal = parseFloat(input.innerText || input.value || "0") || 0;
            timer = setTimeout(() => {
                scrubActive = true;
                document.body.classList.add("dragger-resizing-active");
                input.blur();
            }, 250);
            const onM = (me) => {
                if (!scrubActive) return;
                me.preventDefault();
                const isOpacity = input.name === 'opacity' || input.dataset.prop === 'opacity';
                const delta = me.clientX - startX;
                let newVal;

                if (isOpacity) {
                    // For opacity, 10px move = 0.1 change
                    newVal = Math.max(0, Math.min(1, parseFloat((startVal + delta * 0.01).toFixed(1))));
                } else {
                    newVal = Math.round(startVal + delta);
                }

                if (input.tagName === 'DIV') {
                    input.innerText = newVal;
                    if (isSpacing) {
                        const s = input.dataset.side, b = input.dataset.base;
                        if (s === 'all') setStyle(el, b, newVal + 'px');
                        else setStyle(el, b + capitalize(s), newVal + 'px');
                    }
                } else {
                    input.value = newVal;
                    if (input.classList.contains('side-input')) handleSideChange({ target: input }, el, false);
                    else handleInputChange({ target: input }, el, false);
                }
            };
            const onU = () => {
                clearTimeout(timer);
                if (scrubActive) saveHistory();
                document.body.classList.remove("dragger-resizing-active");
                document.removeEventListener("mousemove", onM);
                document.removeEventListener("mouseup", onU);
                scrubActive = false;
            };
            document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
        });
    }

    function setupDraggable(panel) {
        const header = panel.querySelector("#dragger-header");
        if (!header) return;
        header.onmousedown = (e) => {
            if (e.target.closest(".dragger-icon-btn")) return;
            let startX = e.clientX, startY = e.clientY, rect = panel.getBoundingClientRect();
            let initX = rect.left, initY = rect.top;
            const onM = (me) => {
                panel.style.left = `${Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, initX + me.clientX - startX))}px`;
                panel.style.top = `${Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, initY + me.clientY - startY))}px`;
            };
            const onU = () => { document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU); };
            document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
            e.preventDefault();
        };

        panel.querySelectorAll(".dragger-resize-h").forEach(handle => {
            handle.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const type = handle.dataset.resize;
                const startRect = panel.getBoundingClientRect();
                const startX = e.clientX, startY = e.clientY;

                const onMouseMove = (me) => {
                    const deltaX = me.clientX - startX;
                    const deltaY = me.clientY - startY;

                    if (type.includes('r')) {
                        panel.style.width = `${Math.max(300, startRect.width + deltaX)}px`;
                    }
                    if (type.includes('l')) {
                        const newW = Math.max(300, startRect.width - deltaX);
                        if (newW > 300) {
                            panel.style.width = `${newW}px`;
                            panel.style.left = `${startRect.left + deltaX}px`;
                        }
                    }
                    if (type.includes('b')) {
                        panel.style.height = `${Math.max(200, startRect.height + deltaY)}px`;
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    document.body.classList.remove("dragger-resizing-active");
                };

                document.body.classList.add("dragger-resizing-active");
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            };
        });
    }

    function getUsedFont(fontStack) {
        if (!fontStack) return "Inter";

        // Create canvas once if possible, or create new
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const text = "abcdefghijklmnopqrstuvwxyz0123456789";

        const baselines = ["sans-serif", "serif", "monospace"];
        const baselineDims = {};

        baselines.forEach(base => {
            context.font = "72px " + base;
            baselineDims[base] = context.measureText(text).width;
        });

        const fonts = fontStack.split(',').map(f => f.trim().replace(/['"]/g, ''));

        for (const font of fonts) {
            const lower = font.toLowerCase();
            if (["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"].includes(lower)) {
                return font;
            }

            let detected = false;
            for (const base of baselines) {
                context.font = `72px "${font}", ${base}`;
                const width = context.measureText(text).width;
                if (width !== baselineDims[base]) {
                    detected = true;
                    break;
                }
            }
            if (detected) return font;
        }

        return fonts[0] || "Inter";
    }
})();
