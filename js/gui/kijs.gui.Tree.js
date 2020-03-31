/* global kijs, this */

// --------------------------------------------------------------
// kijs.gui.Tree
// --------------------------------------------------------------
/**
 * EVENTS
 * ----------
 * afterLoad
 * beforeSelectionChange
 * selectionChange
 * rowClick
 * rowDblClick
 *
 */
kijs.gui.Tree = class kijs_gui_Tree extends kijs.gui.Container {


    // --------------------------------------------------------------
    // CONSTRUCTOR
    // --------------------------------------------------------------
    constructor(config={}) {
        super(false);
        this._rpc = null;
        this._facadeFnLoad = null;
        this._facadeFnSave = null;
        this._autoLoad = true;
        this._loaded = false;
        this._nodeId = null;
        this._leaf = true;
        this._rpcArgs = null;
        this._rootVisible = false;

        this._draggable = false;
        this._allowDrag = true;
        this._allowDrop = true;

        this._nodeDom = new kijs.gui.Dom({cls: 'kijs-node'});
        this._elementsDom = new kijs.gui.Dom({cls: 'kijs-expandcontainer'});
        this._treeCaptionDom = new kijs.gui.Dom({cls: 'kijs-treecaption', htmlDisplayType: 'code'});
        this._expandIconDom = new kijs.gui.Dom({cls: 'kijs-expandicon'});

        this._iconEl = new kijs.gui.Icon();
        this._expandedIconEl = new kijs.gui.Icon({cls: 'kijs-expandedicon'});
        this._spinnerIconEl = new kijs.gui.Icon({cls: 'kijs-spinnericon', iconCls: 'kijs-pulse', iconChar: '&#xf110'});

        this._dom.clsAdd('kijs-tree');

        // Events
        this._expandIconDom.on('click', this._onExpandClick, this);

        this._iconEl.on('dblClick', this._onNodeDblClick, this);
        this._expandedIconEl.on('dblClick', this._onNodeDblClick, this);
        this._treeCaptionDom.on('dblClick', this._onNodeDblClick, this);

        this._iconEl.on('singleClick', this._onNodeSingleClick, this);
        this._expandedIconEl.on('singleClick', this._onNodeSingleClick, this);
        this._treeCaptionDom.on('singleClick', this._onNodeSingleClick, this);

        // Drag-Drop-Events
        this.on('ddStart', this._onDdStart, this);
        this.on('ddOver', this._onDdOver, this);
        this.on('ddDrop', this._onDdDrop, this);


        // Standard-config-Eigenschaften mergen
        Object.assign(this._defaultConfig, {
         //   waitMaskTarget           : this,
          //  waitMaskTargetDomProperty: 'dom',
            expandIconChar           : '&#xf105',
            folderIcon               : 'auto'
        });

        // Mapping für die Zuweisung der Config-Eigenschaften
        Object.assign(this._configMap, {
            autoLoad                  : true,
            rootVisible               : true,

            draggable                 : { target: 'draggable', context: this, prio: 200 },
            allowDrag                 : true,
            allowDrop                 : true,

            rpc                       : true,
            rpcArgs                   : true,
            facadeFnLoad              : true,
            facadeFnSave              : true,
            nodeId                    : true,

            // leaf = true = keine Kindknoten
            leaf                      : true,

            // Beziechnung des node
            caption                   : { target: 'html', context: this._treeCaptionDom },

            // Pfeil-Icon im Baum
            expandIconChar            : { target: 'expandIconChar' },

            // icon bei geschlossenem Baum
            iconChar                  : { target: 'iconChar', context: this._iconEl },
            iconCls                   : { target: 'iconCls', context: this._iconEl },
            iconColor                 : { target: 'iconColor', context: this._iconEl },

            // icon bei offenen Baum
            expandedIconChar          : { target: 'iconChar', context: this._expandedIconEl },
            expandedIconCls           : { target: 'iconCls', context: this._expandedIconEl },
            expandedIconColor         : { target: 'iconColor', context: this._expandedIconEl },

            // setzt das 'iconChar' und das 'expandedIconChar' auf ein Ordner-Symbol.
            folderIcon                : { target: 'folderIcon', prio: 10 },

            iconSize                  : { target: 'iconSize' }
        });

        // Config anwenden
        if (kijs.isObject(config)) {
            config = Object.assign({}, this._defaultConfig, config);
            this.applyConfig(config, true);
        }
    }


    // --------------------------------------------------------------
    // GETTERS / SETTERS
    // --------------------------------------------------------------


    get allowDrag() { return this._allowDrag; }
    set allowDrag(val) { this._allowDrag = !!val; }

    get allowDrop() { return this._allowDrop; }
    set allowDrop(val) { this._allowDrop = !!val; }

    get draggable() { return this._draggable; }
    set draggable(val) {
        this._draggable = !!val;

        // drag events
        if (this._draggable) {
            this._nodeDom.nodeAttributeSet('draggable', true);
            kijs.DragDrop.addDragEvents(this, this._nodeDom);
            kijs.DragDrop.addDropEvents(this, this._nodeDom);
        }
    }

    get expanded() { return !!this._innerDom.clsHas('kijs-expanded'); }
    set expanded(val) {
        if (val) {
            this._innerDom.clsAdd('kijs-expanded');
        } else {
            this._innerDom.clsRemove('kijs-expanded');
        }
    }

    get expandIconChar() { return kijs.String.htmlentities(this._expandIconDom.html); }
    set expandIconChar(val) { this._expandIconDom.html = kijs.String.htmlentities_decode(val); }

    get facadeFnLoad() {
        if (this._facadeFnLoad) {
            return this._facadeFnLoad;
        }
        if (this.parent && this.parent instanceof kijs.gui.Tree) {
            return this.parent.facadeFnLoad;
        }
        return null;
    }

    get facadeFnSave() {
        if (this._facadeFnSave) {
            return this._facadeFnSave;
        }
        if (this.parent && this.parent instanceof kijs.gui.Tree) {
            return this.parent.facadeFnSave;
        }
        return null;
    }

    set folderIcon(val) {
        if (val === 'auto') {
            val = (!this._iconEl.iconChar && !this._iconEl.iconCls);
        }

        if (val) {
            this._iconEl.iconChar = '&#xf114';
            this._expandedIconEl.iconChar = '&#xf115';
        }
    }
    get folderIcon() {
        return (this._iconEl.iconChar === '&#xf114' && this._expandedIconEl.iconChar === '&#xf115');
    }

    get leaf() { return this.elements.length === 0 && this._leaf; }
    set leaf(val) { this._leaf = !!val; }

    get loadSpinner() { return !!this._innerDom.clsHas('kijs-loading'); }
    set loadSpinner(val) {
        if (val) {
            this._innerDom.clsAdd('kijs-loading');
        } else {
            this._innerDom.clsRemove('kijs-loading');
        }
    }

    get iconChar() { return this._iconEl.iconChar; }
    set iconChar(val) { this._iconEl.iconChar = val; }

    get iconCls() { return this._iconEl.iconCls; }
    set iconCls(val) { this._iconEl.iconCls = val; }

    get iconColor() { return this._iconEl.iconColor; }
    set iconColor(val) { this._iconEl.iconColor = val; }

    get expandedIconChar() { return this._expandedIconEl.iconChar; }
    set expandedIconChar(val) { this._expandedIconEl.iconChar = val; }

    get expandedIconCls() { return this._expandedIconEl.iconCls; }
    set expandedIconCls(val) { this._expandedIconEl.iconCls = val; }

    get expandedIconColor() { return this._expandedIconEl.iconColor; }
    set expandedIconColor(val) { this._expandedIconEl.iconColor = val; }

    get iconSize() { return this._iconEl.iconSize; }
    set iconSize(val) {
        this._iconEl.iconSize = val;
        this._expandedIconEl.iconSize = val;
        this._spinnerIconEl.iconSize = val;
    }

    get isRemote() { return !!(this._facadeFnLoad || (this.parent && (this.parent instanceof kijs.gui.Tree) && this.parent.isRemote)); }

    get isRoot() { return !this.parent || !(this.parent instanceof kijs.gui.Tree); }

    get nodeId() { return this._nodeId; }
    set nodeId(val) { this._nodeId = val; }

    get rpc() {
        if (this._rpc) {
            return this._rpc;
        }
        if (this.parent && this.parent instanceof kijs.gui.Tree) {
            return this.parent.rpc;
        }
        return null;
    }
    set rpc(val) { this._rpc = val; }

    get rpcArgs() {
        if (this._rpcArgs) {
            return this._rpcArgs;
        }
        if (this.parent && this.parent instanceof kijs.gui.Tree) {
            return this.parent.rpcArgs;
        }
        return null;
    }
    set rpcArgs(val) { this._rpcArgs = val; }

    get selected() { return !!this._innerDom.clsHas('kijs-selected'); }
    set selected(val) {
        if (val) {
            this._innerDom.clsAdd('kijs-selected');
        } else {
            this._innerDom.clsRemove('kijs-selected');
        }
    }


    // --------------------------------------------------------------
    // MEMBERS
    // --------------------------------------------------------------

    /**
     * Fügt ein oder mehrere Elemente hinzu.
     * @param {Object|Array} elements
     * @param {Number} [index=null] Position an der Eingefügt werden soll null=am Schluss
     * @returns {undefined}
     */
    add(elements, index=null) {
        elements = this._recursiveSetProperties(elements);
        super.add(elements, index);
    }

    /**
     * Klappt die Node zu.
     * @returns {undefined}
     */
    collapse() {
        if (this.expanded) {
            this.expanded = false;
            this._raiseRootEvent('collapse');
        }
    }

    /**
     * Klappt die Node auf.
     * @returns {undefined}
     */
    expand() {
        if (!this.leaf) {
            if (this.isRemote && !this.expanded) {
                this.load().then(() => {
                    this.expanded = true;
                    this._raiseRootEvent('expand');
                });
            } else if (!this.expanded) {
                this.expanded = true;
                this._raiseRootEvent('expand');
            }
        }
    }

    /**
     * Gibt den Pfad im Baum zur aktuellen Node zurück.
     * @param {String} separator
     * @returns {String}
     */
    getPath(separator='/') {
        let path = '';
        if (this.isRoot) {
            path += separator;
        } else {
            path += this.parent.getPath(separator) + separator;
        }

        if (this._nodeId !== null) {
            path += kijs.toString(this._nodeId);

        } else if (this.isRoot) {
            path += 'root';

        } else {
            path += '<no-id>';
        }

        return path;
    }

    /**
     * Gibt die Root-Node des aktuellen Baums zurück.
     * @returns {kijs_gui_Tree}
     */
    getRootNode() {
        if (this.parent && this.parent instanceof kijs.gui.Tree) {
            return this.parent.getRootNode();
        }

        return this;
    }

    /**
     * Lädt die Daten vom RPC
     * @param {Object|null} args
     * @param {bool} force
     * @returns {Promise}
     */
    load(args=null, force=false) {
        return new Promise((resolve, reject) => {
            if (!this.isRemote) {
                reject(new kijs.Error('tree not remotable'));

            } else  if ((!this._loaded && this.elements.length === 0) || force) {
                this._loaded = true;

                if (!kijs.isObject(args)) {
                    args = {};
                }

                let defaultRpcArgs = this.rpcArgs;
                if (kijs.isObject(defaultRpcArgs)) {
                    args = Object.assign(args, defaultRpcArgs);
                }

                args.nodeId = this._nodeId;


                // spinner icon
                this.loadSpinner = true;

                this.rpc.do(this.facadeFnLoad, args, function (response) {
                    this.loadSpinner = false;

                    // alle unterelemente entfernen und destructen
                    this.removeAll(false, true);

                    if (response.tree) {
                        this.add(response.tree);
                    }
                    resolve(response);
                }, this, false, 'none');
            } else {
                resolve(null);
            }
        });
    }

    // overwrite
    remove(elements, preventRender=false, destruct=false) {
        super.remove(elements, preventRender, destruct);
        if (this.elements.length === 0) {
            this.collapse();
        }
    }

    // Setzt den 'selected' Status rekursiv
    setSelected(selected, recursive=false) {
        this.selected = !!selected;
        if (recursive) {
            kijs.Array.each(this.elements, function(element) {
                if (element instanceof kijs.gui.Tree) {
                    element.setSelected(!!selected, true);
                }
            }, this);
        }

    }


    // PRIVATE
    /**
     * Führt einen Event nicht nur beim aktuellen, sondern auch beim root-Element aus.
     * @param {Mixed} args
     * @returns {unresolved}
     */
    _raiseRootEvent(...args) {
        let response = this.raiseEvent.apply(this, args);

        if (!this.isRoot) {
            this.getRootNode().raiseEvent.apply(this.getRootNode(), args);
        }
        return response;
    }

    /**
     * Setzt den xtype von unterelementen
     * @param elements
     * @returns {mixed}
     * @private
     */
    _recursiveSetProperties(elements) {
        if (kijs.isObject(elements)) {
            elements = [elements];
        }
        if (kijs.isArray(elements)) {
            for (let i = 0; i < elements.length; i++) {
                let element = elements[i];
                if (kijs.isDefaultObject(element)) {
                    if (element.elements) {
                        element.elements = this._recursiveSetProperties(element.elements);
                    }

                    element.xtype = element.xtype ? element.xtype : 'kijs.gui.Tree';
                    element.draggable = element.draggable ? element.draggable : this.getRootNode().draggable;

                    element.iconChar = element.iconChar ? element.iconChar : this.getRootNode().iconChar;
                    element.iconCls = element.iconCls ? element.iconCls : this.getRootNode().iconCls;
                    element.iconColor = element.iconColor ? element.iconColor : this.getRootNode().iconColor;

                    element.expandedIconChar = element.expandedIconChar ? element.expandedIconChar : this.getRootNode().expandedIconChar;
                    element.expandedIconCls = element.expandedIconCls ? element.expandedIconCls : this.getRootNode().expandedIconCls;
                    element.expandedIconColor = element.expandedIconColor ? element.expandedIconColor : this.getRootNode().expandedIconColor;

                    if (!element.iconSize && this.getRootNode().iconSize) {
                        element.iconSize = this.getRootNode().iconSize;
                    }
                }
            }
        }
        return elements;
    }

    // EVENTS
    /**
     * Klick auf den 'expand' button
     * Öffnet die Node, selektion wird nicht verändert
     * @private
     */
    _onExpandClick() {
        if (this.loadSpinner) {
            return;
        }
        if (this.expanded) {
            this.collapse();
        } else {
            this.expand();
        }

        // Event beim Root auslösen
        this._raiseRootEvent('nodeClick');
    }

    /**
     * Öffnet die Node
     * @returns {undefined}
     */
    _onNodeDblClick() {
        if (this.loadSpinner) {
            return;
        }
        if (this.expanded) {
            this.collapse();
        } else {
            this.expand();
        }

        // Event beim Root auslösen
        this._raiseRootEvent('nodeDblClick');
    }

    // Selektiert die Node
    _onNodeSingleClick() {
        if (this.loadSpinner) {
            return;
        }
        // alles deselektieren, nur aktuelle selektiert
        this.getRootNode().setSelected(false, true);
        this.selected = true;
        this._raiseRootEvent('select');
    }


    // DragDrop

    /**
     * Wenn dieses Element verschoben wird.
     * @param {Object} dragData
     */
    _onDdStart(dragData) {
        dragData.position.allowLeft = false;
        dragData.position.allowRight = false;
        dragData.position.allowAbove = false;
        dragData.position.allowBelow = false;
        dragData.position.allowRight = false;
        dragData.position.margin = 4;
    }

    /**
     * Wenn ein Element über diesem Element ist
     * @param {Object} dragData
     * @returns {undefined}
     */
    _onDdOver(dragData) {

        // Ein Ordner kann nicht in sein Kindordner gezogen werden
        if (!this.draggable || this.isChildOf(dragData.sourceElement)) {
            dragData.position.allowAbove = false;
            dragData.position.allowBelow = false;
            dragData.position.allowOnto = false;

        } else {

            // erlaubt der parent, dass neue elemente hinzugefügt werden?
            let parentAllowDrop = false;
            if (this.parent instanceof kijs.gui.Tree) {
                parentAllowDrop = this.parent.allowDrop;
            }

            if (dragData.sourceElement.allowDrag) {
                dragData.position.allowAbove = parentAllowDrop;
                dragData.position.allowBelow = parentAllowDrop;
                dragData.position.allowOnto = this._allowDrop;
            }
        }

    }

    /**
     * Wenn ein Objekt auf dieses Element gesetzt wird
     * @param {Object} dropData
     * @returns {undefined}
     */
    _onDdDrop(dropData) {
        if (this.draggable) {
            let eventData = {
                movedNode   : dropData.sourceElement,
                movedId     : dropData.sourceElement.nodeId,
                targetNode  : this,
                targetId    : this.nodeId,
                position    : dropData.position.position
            };
            this._raiseRootEvent('dragDrop', eventData);

            // neu laden
            if (this.isRemote) {

                // verschieben über rpc melden
                if (this.facadeFnSave && this.rpc) {
                    this.rpc.do(this.facadeFnSave, {
                        movedId: eventData.movedId,
                        targetId: eventData.targetId,
                        position: eventData.position
                    });
                }

                // Trees zum neu laden
                let nodeA = eventData.movedNode.parent;
                let nodeB = eventData.position === 'onto' ? this : this.parent;

                // node A nur neu laden, wenn sie kein Kind von B ist.
                if (nodeA instanceof kijs.gui.Tree && !nodeA.isChildOf(nodeB)) {
                    nodeA.load(null, true);
                }

                // Node B nur neu laden, wenn sie kein Kind von A ist
                if (nodeB !== nodeA && nodeB instanceof kijs.gui.Tree && !nodeB.isChildOf(nodeA)) {
                    nodeB.load(null, true);
                }

            // Elemente verschieben im Dom
            } else {
                // Node entfernen
                eventData.movedNode.parent.remove(eventData.movedNode);

                // Node wieder einfügen.
                if (eventData.position === 'onto') {
                    this.add(eventData.movedNode);

                } else {
                    let index = this.parent.elements.indexOf(this);
                    if (eventData.position === 'below') {
                        index++;
                    }

                    this.parent.add(eventData.movedNode, index);
                }
            }
        }
    }


    // Overwrite
    render(superCall) {

        // Falls die Root-Node nicht angezeigt werden soll,
        // wird das Element als normaler Container gerendert.
        if (!this._rootVisible && this.isRoot) {
            super.render();

        } else {

            // render vom Container überspringen,
            // damit elemente nicht in den innerDom gerendert werden
            kijs.gui.Element.prototype.render.call(this, true);

            // innerDOM rendern
            this._innerDom.renderTo(this._dom.node);

            // node in den innerDom
            this._nodeDom.renderTo(this._innerDom.node);

            // elementDom in den innerDom
            this._elementsDom.renderTo(this._innerDom.node);

            // elements im elementDom rendern
            kijs.Array.each(this._elements, function(el) {
                el.renderTo(this._elementsDom.node);
            }, this);

            this._expandIconDom.renderTo(this._nodeDom.node);
            this._iconEl.renderTo(this._nodeDom.node);
            this._expandedIconEl.renderTo(this._nodeDom.node);
            this._spinnerIconEl.renderTo(this._nodeDom.node);
            this._treeCaptionDom.renderTo(this._nodeDom.node);
    }

        // leerer ordner
        if (this.leaf) {
            this._expandIconDom.clsAdd('kijs-leaf');
        } else {
            this._expandIconDom.clsRemove('kijs-leaf');
        }

        // Event afterRender auslösen
        if (!superCall) {
            this.raiseEvent('afterRender');
        }

        if (this._autoLoad && this.isRemote && this.isRoot) {
            this.load();
        }
    }

    // overwrite
    unrender(superCall) {
        // Event auslösen.
        if (!superCall) {
            this.raiseEvent('unrender');
        }

        super.unrender(true);
    }


    // --------------------------------------------------------------
    // DESTRUCTOR
    // --------------------------------------------------------------
    destruct(superCall) {
        if (!superCall) {
            // unrendern
            this.unrender(superCall);

            // Event auslösen.
            this.raiseEvent('destruct');
        }

        // Basisklasse entladen
        super.destruct(true);
    }
};
