/* global kijs, this */

// --------------------------------------------------------------
// kijs.gui.grid.filter.Text
// --------------------------------------------------------------
kijs.gui.grid.filter.Text = class kijs_gui_grid_filter_Text extends kijs.gui.grid.filter.Filter {


    // --------------------------------------------------------------
    // CONSTRUCTOR
    // --------------------------------------------------------------
    // overwrite
    constructor(config={}) {
        super(false);

        this._applyFilter = true;
        this._compare = 'begin'; // full, part
        this._searchField = new kijs.gui.field.Text({
            on: {
                change: function() {
                    if (this._applyFilter) {
                        this._applyToGrid();
                    }
                    this._applyFilter = true;
                },
                keyDown: this.#onKeyDown,
                context: this
            }
        });

        // Standard-config-Eigenschaften mergen
        Object.assign(this._defaultConfig, {
            placeholder: kijs.getText('Suche') + '...'
        });

        // Mapping für die Zuweisung der Config-Eigenschaften
        Object.assign(this._configMap, {
            placeholder: {target: 'placeholder'},
            compare: true
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
    get filter() {
        return Object.assign(super.filter, {
            type: 'text',
            search: this._searchField.value,
            compare: this._compare
        });
    }

    get isFiltered() { return super.isFiltered || this._searchField.value !== ''; }

    get placeholder() { return this._searchField.placeholder; }
    set placeholder(val) { this._searchField.placeholder = val; }



    // --------------------------------------------------------------
    // MEMBERS
    // --------------------------------------------------------------
    hasFocus() {
        if (super.hasFocus() || this._searchField.hasFocus) {
            return true;
        }

        return false;
    }

    // overwrite
    render(superCall) {
        super.render(true);

        this._searchField.renderTo(this._searchContainer.node);

        // Event afterRender auslösen
        if (!superCall) {
            this.raiseEvent('afterRender');
        }
    }
    
    reset() {
        this._searchField.value = '';
        super.reset();
    }


    // PROTECTED
    // overwrite
    _getMenuButtons() {
        return kijs.Array.concat(this._getDefaultMenuButtons(),
            ['-',{
                name: 'btn_compare_begin',
                caption : kijs.getText('Feldanfang'),
                iconMap: this._compare === 'begin' ? 'kijs.iconMap.Fa.square-check' : 'kijs.iconMap.Fa.square',
                on: {
                    click: this.#onCompareBtnClick,
                    context: this
                }
            },{
                caption : kijs.getText('Beliebiger Teil'),
                name: 'btn_compare_part',
                iconMap: this._compare === 'part' ? 'kijs.iconMap.Fa.square-check' : 'kijs.iconMap.Fa.square',
                on: {
                    click: this.#onCompareBtnClick,
                    context: this
                }
            },{
                caption : kijs.getText('Ganzes Feld'),
                name: 'btn_compare_full',
                iconMap: this._compare === 'full' ? 'kijs.iconMap.Fa.square-check' : 'kijs.iconMap.Fa.square',
                on: {
                    click: this.#onCompareBtnClick,
                    context: this
                }
            }],
            this._getCheckboxMenuButtons()
        );
    }


    // PRIVATE
    // LISTENERS
    #onCompareBtnClick(e) {
        this._menuButton.menu.close();

        if (e.element.name === 'btn_compare_begin') {
            this._compare = 'begin';
        } else if (e.element.name === 'btn_compare_part') {
            this._compare = 'part';
        } else if (e.element.name === 'btn_compare_full') {
            this._compare = 'full';
        }

        kijs.Array.each(e.element.parent.elements, function(element) {
            if (element.name === e.element.name) {
                element.iconMap = 'kijs.iconMap.Fa.square-check';
            } else if (kijs.Array.contains(['btn_compare_begin', 'btn_compare_part', 'btn_compare_full'], element.name)) {
                element.iconMap = 'kijs.iconMap.Fa.square';
            }
        });
    }

    #onKeyDown(e) {
        e.nodeEvent.stopPropagation();
        if (e.nodeEvent.key === 'Enter') {
            e.nodeEvent.preventDefault();
            this._applyToGrid(true);
            this._applyFilter = false;
        }
    }
    
    
    
    // --------------------------------------------------------------
    // DESTRUCTOR
    // --------------------------------------------------------------
    // overwrite
    destruct(superCall) {
        if (!superCall) {
            // unrendern
            this.unrender(superCall);

            // Event auslösen.
            this.raiseEvent('destruct');
        }
        
        // Elemente/DOM-Objekte entladen
        if (this._searchField) {
            this._searchField.destruct();
        }
        
        // Variablen (Objekte/Arrays) leeren
        this._searchField = null;
        
        // Basisklasse entladen
        super.destruct(true);
    }
    
};