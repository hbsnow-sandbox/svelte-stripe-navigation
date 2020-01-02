
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function not_equal(a, b) {
        return a != a ? b == b : a !== b;
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const menuList = readable([
      'products',
      'developers',
      'company'
    ]);

    const activeMenu = writable(null);

    /* src/components/header/Menu.svelte generated by Svelte v3.16.7 */

    const file = "src/components/header/Menu.svelte";

    function create_fragment(ctx) {
    	let button;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*menu*/ ctx[0]);
    			attr_dev(button, "class", "menu svelte-d9ezeh");
    			add_location(button, file, 6, 0, 67);

    			dispose = [
    				listen_dev(button, "mouseenter", /*mouseenter_handler*/ ctx[1], false, false, false),
    				listen_dev(button, "mouseleave", /*mouseleave_handler*/ ctx[2], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*menu*/ 1) set_data_dev(t, /*menu*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { menu } = $$props;
    	const writable_props = ["menu"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	function mouseenter_handler(event) {
    		bubble($$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("menu" in $$props) $$invalidate(0, menu = $$props.menu);
    	};

    	$$self.$capture_state = () => {
    		return { menu };
    	};

    	$$self.$inject_state = $$props => {
    		if ("menu" in $$props) $$invalidate(0, menu = $$props.menu);
    	};

    	return [menu, mouseenter_handler, mouseleave_handler];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, not_equal, { menu: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*menu*/ ctx[0] === undefined && !("menu" in props)) {
    			console.warn("<Menu> was created without expected prop 'menu'");
    		}
    	}

    	get menu() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menu(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/header/MenuList.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/components/header/MenuList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (15:2) {#each $menuList as menu, i}
    function create_each_block(ctx) {
    	let current;

    	function mouseenter_handler(...args) {
    		return /*mouseenter_handler*/ ctx[3](/*i*/ ctx[7], ...args);
    	}

    	const menu = new Menu({
    			props: {
    				menu: /*menu*/ ctx[5],
    				index: /*i*/ ctx[7]
    			},
    			$$inline: true
    		});

    	menu.$on("mouseenter", mouseenter_handler);
    	menu.$on("mouseleave", /*mouseleave_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const menu_changes = {};
    			if (dirty & /*$menuList*/ 1) menu_changes.menu = /*menu*/ ctx[5];
    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(15:2) {#each $menuList as menu, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let nav;
    	let current;
    	let each_value = /*$menuList*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(nav, "class", "nav svelte-1q4l8y6");
    			add_location(nav, file$1, 13, 0, 224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$menuList, enter, leave*/ 7) {
    				each_value = /*$menuList*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(nav, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $menuList;
    	validate_store(menuList, "menuList");
    	component_subscribe($$self, menuList, $$value => $$invalidate(0, $menuList = $$value));

    	const enter = index => {
    		activeMenu.set(index);
    	};

    	const leave = () => {
    		activeMenu.set(null);
    	};

    	const mouseenter_handler = i => enter(i);
    	const mouseleave_handler = () => leave();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$menuList" in $$props) menuList.set($menuList = $$props.$menuList);
    	};

    	return [$menuList, enter, leave, mouseenter_handler, mouseleave_handler];
    }

    class MenuList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MenuList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/header/Popover.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/components/header/Popover.svelte";
    const get_company_slot_changes = dirty => ({});
    const get_company_slot_context = ctx => ({});
    const get_developers_slot_changes = dirty => ({});
    const get_developers_slot_context = ctx => ({});
    const get_products_slot_changes = dirty => ({});
    const get_products_slot_context = ctx => ({});

    // (84:2) {#if dimensions.products}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "background svelte-y6b3j4");
    			set_style(div, "width", parseInt(/*dimensions*/ ctx[0].products.width) + "px");
    			set_style(div, "height", parseInt(/*dimensions*/ ctx[0].products.height) + "px");
    			set_style(div, "transform", "translateX(" + /*lastActiveMenu*/ ctx[5] * 120 + "px)\n          " + /*calcBackgroundScale*/ ctx[8]() + "\n        ");
    			add_location(div, file$2, 84, 4, 2435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dimensions*/ 1) {
    				set_style(div, "width", parseInt(/*dimensions*/ ctx[0].products.width) + "px");
    			}

    			if (dirty & /*dimensions*/ 1) {
    				set_style(div, "height", parseInt(/*dimensions*/ ctx[0].products.height) + "px");
    			}

    			if (dirty & /*lastActiveMenu*/ 32) {
    				set_style(div, "transform", "translateX(" + /*lastActiveMenu*/ ctx[5] * 120 + "px)\n          " + /*calcBackgroundScale*/ ctx[8]() + "\n        ");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(84:2) {#if dimensions.products}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let section0;
    	let t0;
    	let section1;
    	let t1;
    	let section2;
    	let div0_style_value;
    	let t2;
    	let current;
    	const products_slot_template = /*$$slots*/ ctx[11].products;
    	const products_slot = create_slot(products_slot_template, ctx, /*$$scope*/ ctx[10], get_products_slot_context);
    	const developers_slot_template = /*$$slots*/ ctx[11].developers;
    	const developers_slot = create_slot(developers_slot_template, ctx, /*$$scope*/ ctx[10], get_developers_slot_context);
    	const company_slot_template = /*$$slots*/ ctx[11].company;
    	const company_slot = create_slot(company_slot_template, ctx, /*$$scope*/ ctx[10], get_company_slot_context);
    	let if_block = /*dimensions*/ ctx[0].products && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			section0 = element("section");
    			if (products_slot) products_slot.c();
    			t0 = space();
    			section1 = element("section");
    			if (developers_slot) developers_slot.c();
    			t1 = space();
    			section2 = element("section");
    			if (company_slot) company_slot.c();
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(section0, "class", "section svelte-y6b3j4");

    			set_style(section0, "width", /*dimensions*/ ctx[0].products
    			? `${parseInt(/*dimensions*/ ctx[0].products.width)}px`
    			: "auto");

    			set_style(section0, "height", /*dimensions*/ ctx[0].products
    			? `${parseInt(/*dimensions*/ ctx[0].products.height)}px`
    			: "auto");

    			toggle_class(section0, "active", /*$activeMenu*/ ctx[6] === 0);
    			add_location(section0, file$2, 48, 4, 1290);
    			attr_dev(section1, "class", "section svelte-y6b3j4");

    			set_style(section1, "width", /*dimensions*/ ctx[0].developers
    			? `${parseInt(/*dimensions*/ ctx[0].developers.width)}px`
    			: "auto");

    			set_style(section1, "height", /*dimensions*/ ctx[0].developers
    			? `${parseInt(/*dimensions*/ ctx[0].developers.height)}px`
    			: "auto");

    			toggle_class(section1, "active", /*$activeMenu*/ ctx[6] === 1);
    			add_location(section1, file$2, 59, 4, 1657);
    			attr_dev(section2, "class", "section svelte-y6b3j4");

    			set_style(section2, "width", /*dimensions*/ ctx[0].company
    			? `${parseInt(/*dimensions*/ ctx[0].company.width)}px`
    			: "auto");

    			set_style(section2, "height", /*dimensions*/ ctx[0].company
    			? `${parseInt(/*dimensions*/ ctx[0].company.height)}px`
    			: "auto");

    			toggle_class(section2, "active", /*$activeMenu*/ ctx[6] === 2);
    			add_location(section2, file$2, 70, 4, 2036);
    			attr_dev(div0, "class", "content svelte-y6b3j4");

    			attr_dev(div0, "style", div0_style_value = "\n      " + (/*lastActiveMenu*/ ctx[5] !== null
    			? `
        width: ${parseInt(/*dimensions*/ ctx[0][/*$menuList*/ ctx[7][/*lastActiveMenu*/ ctx[5]]].width)}px;
        height: ${parseInt(/*dimensions*/ ctx[0][/*$menuList*/ ctx[7][/*lastActiveMenu*/ ctx[5]]].height)}px;
      `
    			: "") + "\n      transform: translateX(" + /*lastActiveMenu*/ ctx[5] * 120 + "px);\n    ");

    			add_location(div0, file$2, 37, 2, 976);
    			attr_dev(div1, "class", "popover svelte-y6b3j4");
    			toggle_class(div1, "open", /*$activeMenu*/ ctx[6] !== null);
    			add_location(div1, file$2, 32, 0, 884);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, section0);

    			if (products_slot) {
    				products_slot.m(section0, null);
    			}

    			/*section0_binding*/ ctx[12](section0);
    			append_dev(div0, t0);
    			append_dev(div0, section1);

    			if (developers_slot) {
    				developers_slot.m(section1, null);
    			}

    			/*section1_binding*/ ctx[13](section1);
    			append_dev(div0, t1);
    			append_dev(div0, section2);

    			if (company_slot) {
    				company_slot.m(section2, null);
    			}

    			/*section2_binding*/ ctx[14](section2);
    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    			/*div1_binding*/ ctx[15](div1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (products_slot && products_slot.p && dirty & /*$$scope*/ 1024) {
    				products_slot.p(get_slot_context(products_slot_template, ctx, /*$$scope*/ ctx[10], get_products_slot_context), get_slot_changes(products_slot_template, /*$$scope*/ ctx[10], dirty, get_products_slot_changes));
    			}

    			if (!current || dirty & /*dimensions*/ 1) {
    				set_style(section0, "width", /*dimensions*/ ctx[0].products
    				? `${parseInt(/*dimensions*/ ctx[0].products.width)}px`
    				: "auto");
    			}

    			if (!current || dirty & /*dimensions*/ 1) {
    				set_style(section0, "height", /*dimensions*/ ctx[0].products
    				? `${parseInt(/*dimensions*/ ctx[0].products.height)}px`
    				: "auto");
    			}

    			if (dirty & /*$activeMenu*/ 64) {
    				toggle_class(section0, "active", /*$activeMenu*/ ctx[6] === 0);
    			}

    			if (developers_slot && developers_slot.p && dirty & /*$$scope*/ 1024) {
    				developers_slot.p(get_slot_context(developers_slot_template, ctx, /*$$scope*/ ctx[10], get_developers_slot_context), get_slot_changes(developers_slot_template, /*$$scope*/ ctx[10], dirty, get_developers_slot_changes));
    			}

    			if (!current || dirty & /*dimensions*/ 1) {
    				set_style(section1, "width", /*dimensions*/ ctx[0].developers
    				? `${parseInt(/*dimensions*/ ctx[0].developers.width)}px`
    				: "auto");
    			}

    			if (!current || dirty & /*dimensions*/ 1) {
    				set_style(section1, "height", /*dimensions*/ ctx[0].developers
    				? `${parseInt(/*dimensions*/ ctx[0].developers.height)}px`
    				: "auto");
    			}

    			if (dirty & /*$activeMenu*/ 64) {
    				toggle_class(section1, "active", /*$activeMenu*/ ctx[6] === 1);
    			}

    			if (company_slot && company_slot.p && dirty & /*$$scope*/ 1024) {
    				company_slot.p(get_slot_context(company_slot_template, ctx, /*$$scope*/ ctx[10], get_company_slot_context), get_slot_changes(company_slot_template, /*$$scope*/ ctx[10], dirty, get_company_slot_changes));
    			}

    			if (!current || dirty & /*dimensions*/ 1) {
    				set_style(section2, "width", /*dimensions*/ ctx[0].company
    				? `${parseInt(/*dimensions*/ ctx[0].company.width)}px`
    				: "auto");
    			}

    			if (!current || dirty & /*dimensions*/ 1) {
    				set_style(section2, "height", /*dimensions*/ ctx[0].company
    				? `${parseInt(/*dimensions*/ ctx[0].company.height)}px`
    				: "auto");
    			}

    			if (dirty & /*$activeMenu*/ 64) {
    				toggle_class(section2, "active", /*$activeMenu*/ ctx[6] === 2);
    			}

    			if (!current || dirty & /*lastActiveMenu, dimensions, $menuList*/ 161 && div0_style_value !== (div0_style_value = "\n      " + (/*lastActiveMenu*/ ctx[5] !== null
    			? `
        width: ${parseInt(/*dimensions*/ ctx[0][/*$menuList*/ ctx[7][/*lastActiveMenu*/ ctx[5]]].width)}px;
        height: ${parseInt(/*dimensions*/ ctx[0][/*$menuList*/ ctx[7][/*lastActiveMenu*/ ctx[5]]].height)}px;
      `
    			: "") + "\n      transform: translateX(" + /*lastActiveMenu*/ ctx[5] * 120 + "px);\n    ")) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (/*dimensions*/ ctx[0].products) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$activeMenu*/ 64) {
    				toggle_class(div1, "open", /*$activeMenu*/ ctx[6] !== null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(products_slot, local);
    			transition_in(developers_slot, local);
    			transition_in(company_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(products_slot, local);
    			transition_out(developers_slot, local);
    			transition_out(company_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (products_slot) products_slot.d(detaching);
    			/*section0_binding*/ ctx[12](null);
    			if (developers_slot) developers_slot.d(detaching);
    			/*section1_binding*/ ctx[13](null);
    			if (company_slot) company_slot.d(detaching);
    			/*section2_binding*/ ctx[14](null);
    			if (if_block) if_block.d();
    			/*div1_binding*/ ctx[15](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $activeMenu;
    	let $menuList;
    	validate_store(activeMenu, "activeMenu");
    	component_subscribe($$self, activeMenu, $$value => $$invalidate(6, $activeMenu = $$value));
    	validate_store(menuList, "menuList");
    	component_subscribe($$self, menuList, $$value => $$invalidate(7, $menuList = $$value));
    	let dimensions = {};
    	let popoverLeft;
    	let popoverElem;
    	let productsElem;
    	let developersElem;
    	let companyElem;

    	onMount(() => {
    		popoverLeft = popoverElem.getBoundingClientRect().x;
    		$$invalidate(0, dimensions.products = productsElem.getBoundingClientRect(), dimensions);
    		$$invalidate(0, dimensions.developers = developersElem.getBoundingClientRect(), dimensions);
    		$$invalidate(0, dimensions.company = companyElem.getBoundingClientRect(), dimensions);
    	});

    	let lastActiveMenu = null;

    	const calcBackgroundScale = () => {
    		if (lastActiveMenu === null) return "";

    		return `
      scaleX(${dimensions[$menuList[lastActiveMenu]].width / dimensions.products.width})
      scaleY(${dimensions[$menuList[lastActiveMenu]].height / dimensions.products.height})
    `;
    	};

    	let { $$slots = {}, $$scope } = $$props;

    	function section0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, productsElem = $$value);
    		});
    	}

    	function section1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, developersElem = $$value);
    		});
    	}

    	function section2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, companyElem = $$value);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, popoverElem = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("dimensions" in $$props) $$invalidate(0, dimensions = $$props.dimensions);
    		if ("popoverLeft" in $$props) popoverLeft = $$props.popoverLeft;
    		if ("popoverElem" in $$props) $$invalidate(1, popoverElem = $$props.popoverElem);
    		if ("productsElem" in $$props) $$invalidate(2, productsElem = $$props.productsElem);
    		if ("developersElem" in $$props) $$invalidate(3, developersElem = $$props.developersElem);
    		if ("companyElem" in $$props) $$invalidate(4, companyElem = $$props.companyElem);
    		if ("lastActiveMenu" in $$props) $$invalidate(5, lastActiveMenu = $$props.lastActiveMenu);
    		if ("$activeMenu" in $$props) activeMenu.set($activeMenu = $$props.$activeMenu);
    		if ("$menuList" in $$props) menuList.set($menuList = $$props.$menuList);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeMenu*/ 64) {
    			 if ($activeMenu !== null) {
    				$$invalidate(5, lastActiveMenu = $activeMenu);
    			}
    		}
    	};

    	return [
    		dimensions,
    		popoverElem,
    		productsElem,
    		developersElem,
    		companyElem,
    		lastActiveMenu,
    		$activeMenu,
    		$menuList,
    		calcBackgroundScale,
    		popoverLeft,
    		$$scope,
    		$$slots,
    		section0_binding,
    		section1_binding,
    		section2_binding,
    		div1_binding
    	];
    }

    class Popover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popover",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/header/Header.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/components/header/Header.svelte";

    // (9:4) <div slot="products">
    function create_products_slot(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Foo";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Bar";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "Baz";
    			add_location(li0, file$3, 10, 8, 200);
    			add_location(li1, file$3, 11, 8, 221);
    			add_location(li2, file$3, 12, 8, 242);
    			add_location(ul, file$3, 9, 6, 187);
    			attr_dev(div, "slot", "products");
    			add_location(div, file$3, 8, 4, 159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_products_slot.name,
    		type: "slot",
    		source: "(9:4) <div slot=\\\"products\\\">",
    		ctx
    	});

    	return block;
    }

    // (16:4) <div slot="developers">
    function create_developers_slot(ctx) {
    	let div;
    	let ul;
    	let li;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li = element("li");
    			li.textContent = "hbsnow";
    			add_location(li, file$3, 17, 8, 325);
    			add_location(ul, file$3, 16, 6, 312);
    			attr_dev(div, "slot", "developers");
    			add_location(div, file$3, 15, 4, 282);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_developers_slot.name,
    		type: "slot",
    		source: "(16:4) <div slot=\\\"developers\\\">",
    		ctx
    	});

    	return block;
    }

    // (21:4) <div slot="company">
    function create_company_slot(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "A";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "B";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "C";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "D";
    			add_location(li0, file$3, 22, 8, 408);
    			add_location(li1, file$3, 23, 8, 427);
    			add_location(li2, file$3, 24, 8, 446);
    			add_location(li3, file$3, 25, 8, 465);
    			add_location(ul, file$3, 21, 6, 395);
    			attr_dev(div, "slot", "company");
    			add_location(div, file$3, 20, 4, 368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_company_slot.name,
    		type: "slot",
    		source: "(21:4) <div slot=\\\"company\\\">",
    		ctx
    	});

    	return block;
    }

    // (8:2) <Popover>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(8:2) <Popover>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let header;
    	let t;
    	let current;
    	const menulist = new MenuList({ $$inline: true });

    	const popover = new Popover({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					company: [create_company_slot],
    					developers: [create_developers_slot],
    					products: [create_products_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(menulist.$$.fragment);
    			t = space();
    			create_component(popover.$$.fragment);
    			attr_dev(header, "class", "header svelte-o8mcsn");
    			add_location(header, file$3, 5, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(menulist, header, null);
    			append_dev(header, t);
    			mount_component(popover, header, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const popover_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				popover_changes.$$scope = { dirty, ctx };
    			}

    			popover.$set(popover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menulist.$$.fragment, local);
    			transition_in(popover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menulist.$$.fragment, local);
    			transition_out(popover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(menulist);
    			destroy_component(popover);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			attr_dev(div, "class", "app svelte-qft5d5");
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
