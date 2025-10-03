const DIM_RACK_WIDTH = 380;
const DIM_FRAME_WIDTH = 320;
const DIM_FRAME_HEIGHT = 36;
const DIM_FRAME_BOTTOM = 30;
const DIM_FRAME_SIDES = 30;
const DIM_FRAME_SPACING = 0;
const DIM_RACK_SPACING = 24;
const DIM_RACK_LABEL_SIZE = 30;
const DIM_COLLAPSED_WIDTH = 100;

class VisualItem {
	/**
	 * Indent used when outputting code.
	 */
	static indent ="    ";
	/**
	Contains hitboxes of all VisualItems.
	 */
	static hitboxMapping = [];
	/**
	This item's X coordinate, relative to parent.
	 */
	x = 0;
	/**
	This item's Y coordinate, relative to parent.
	 */
	y = 0;
	/**
	This item's X coordinate, relative to the canvas, calculated.
	 */
	cX = 0;
	/**
	This item's Y coordinate, relative to the canvas, calculated.
	 */
	cY = 0;
	/**
	This item's height.
	 */
	height = 1;
	/**
	This item's width.
	 */
	width = 1;
	/**
	This item's normal selection priority.
	 */
	selectionOrder = 0;
	/**
	This item's selection priority, override.
	 */
	overrideSO = 0;
	/**
	This item's label, can be empty.
	 */
	label = "";
	/**
	Contains any items that are part of this item.
	 */
	subItems = [];
	/**
	Unique name to identify this item amongst any sibling items.
	 */
	name = "";
	/**
	This item's containing item - null for root items.
	 */
	parent = null;
	/**
	Represents the item's type.
	 */
	type = "";
	/**
	Keeps track of the next free slot (unique integer identifier among sibling items).
	 */
	nextSlot = 0;
	/**
	Applies to diagonal testing on the item's hitbox.
	 */
	flip = false;
	/**
	This element's explicit collapsed/compact state.
	 */
	collapseState = false;
	/**
	This flag determines if the item will be rendered as collapsed or not.
	 */
	collapseView = false;
	/**
	 * Creates a generic base object.
	 * @param {string} type - type of the specific object.
	 * @param {string} name - name, must be unique in the current scope.
	 * @param {string} parent - parent object that will contain this one, null for top-level objects.
	 */
	constructor(type, name, parent = null) {
		this.name = name;
		this.parent = parent;
		this.type = type;
	}
	/**
	 * Checks if there is already an item with this name in this object.
	 * @param {string} name - Name to check.
	 * @returns {bool} true if the item was found, false otherwise.
	 */
	checkName(name) {
		let collision = this.fetchName(name);
		return !!collision;
	}
	/**
	 * Retrieves an item by its name from this object.
	 * @param {string} name - Name of the item to try to fetch.
	 * @returns 
	 */
	fetchName(name) {
		let collision = this.subItems.find((subItem) => { return subItem.name === name; });
		return collision;
	}
	/**
	 * Attempts to locate an object by its "address" consisting of
	 * a hierarchy of names, with the more "significant" components on the left
	 * @param  {...any} args - A sequence of names to search for.
	 * @returns The object if found, or a null.
	 */
	find(...args)
	{
		// if this was called with an empty array, it means
		// the item this was called on is the one being searched for,
		// return it
		if(args.length <1)
		{
			return this;
		}
		//console.log("aaaaa", arguments);
		// otherwise, pick the leftmost name
		const current = args.shift();
		// search for an item with the name inside this item's child items
		let result = this.subItems.find((subItem)=>{return subItem.name == current});
		// if found, call find on it with the remaining list
		if(result)
		{
			//console.log(result);
			return result.find(...args);
		}
		// if still here, drop a null
		return null;
	}
	/**
	 * Attempts to add an item to this object.
	 * @param {VisualItem} item - The item to be added. 
	 * @returns true if the item was added, false otherwise.
	 */
	addItem(item) {

		if (this.checkName(item)) {
			return false;
		}
		this.subItems.push(item);
		return true;
	}

	/**
	 * Finds and returns the next unused numeric ID ("slot").
	 * @returns {int} - a numeric ID guaranteed to be unused in this object.
	 */
	getNextSlot () {
		let current = this.nextSlot;
		while (this.checkSlot(current)) {
			current++;
		}
		this.nextSlot = current + 1;
		return current;
	}
	/**
	 * Checks if a given numeric ID is in use.
	 * @param {int} slot - the ID to check.
	 * @returns - true if ID is in use, false otherwise.
	 */
	checkSlot (slot) {
		console.log("checking slot ", slot, " in ", this.subItems);
		let collision = this.subItems.find((subItem) => { return subItem.slot === slot; });
		return !!collision;
	}

	/**
	 * Retrieves this item's bounding box.
	 * @param {boolean} useTexel - if set to true, will shift the box by 0.5 to properly
	 * render on canvas which uses texel offsets. Only to be used for uneven line widths.
	 * @returns - this item's bounding box as a rectangle.
	 */
	getRect (useTexel = false) {
		let offset = useTexel ? 0.5 : 0;
		const rect = new GetRect(this.cX + offset, this.cY + offset, this.width, this.height);
		//console.log(this.type, this.name);
		//console.log(rect);
		return rect;
	}
	/**
	 * Retrieves a combined label of this item and its parents.
	 * @param {string} separator - the string to separate the label's components with. 
	 * @returns - the full label.
	 */
	getFullLabel(separator = "/")
	{
		if(!this.parent)
		{
			return this.getLabel();
		}
		// if this is not the topmost item, recurse
		return this.parent.getFullLabel(separator) + separator + (this.getLabel());
	}
	/**
	 * Retrieves this item's fully qualified name uniquely identifying the item inside the root item.
	 * @param {string} separator - the string to separate individual names.
	 * @returns - the fully qualified name.
	 */
	getFullName(separator = "/")
	{
		if(!this.parent)
		{
			return this.name;
		}
		// if this is not the topmost item, recurse
		return this.parent.getFullName(separator) + separator + (this.name);
	}
	/**
	 * Refreshes all items' hitboxes.
	 */
	updateHitboxMapping()
	{
		// check if the item already has an entry
		let hitboxRef = VisualItem.hitboxMapping.find((hitbox)=>hitbox.item === this);
		if(!hitboxRef)
		{
			// create if not
			hitboxRef = {};
			VisualItem.hitboxMapping.push(hitboxRef);
		}
		// reference to the item 
		hitboxRef.item = this;
		// selection priority, bumping it with the override
		hitboxRef.level = Math.max(this.selectionOrder, this.overrideSO);
		// hitbox for rough detection
		hitboxRef.hitbox = this.getRect();
		// display string (for status bar usage or such)
		hitboxRef.label = this.getFullLabel();
		// recurse to subitems
		this.subItems.forEach((item) => {
			item.updateHitboxMapping();
		});
		
	}
	/**
	 * Generates a string to indent a code line with.
	 * @param {Number} level - indent level to generate
	 * @returns {string} - the string to prepend to the code line.
	 */
	getIndent(level)
	{
		return VisualItem.indent.repeat(level);
	}
	/**
	 * Formats a code line that can be parsed.
	 * @param {string} keyword - the keyword to use
	 * @param {number} indent - the line's indent level
	 * @param  {...string} params - params for the keyword
	 * @returns {string} - a properly formatted and indented code line, terminated by a newline.
	 */
	formatLine(keyword, indent, ...params)
	{
		return this.getIndent(indent) + keyword.toUpperCase() + " " + params.join(" ") + "\n";
	}
	/**
	 * A shortcut for @see VisualItem.formatLine()
	 * @param {string} keyword - the keyword to use
	 * @param {number} indent - the line's indent level
	 * @param  {...string} params - params for the keyword
	 * @returns {string} - a properly formatted and indented code line, terminated by a newline.
	 */
	_f(keyword, indent, ...params)
	{
		return this.formatLine(keyword, indent, ...params);
	}


	//************* Stuff to override begins here */

	//*************  object handling
	/**
	 * Finalises and validates the object.
	 * @param {VisualParser} parser - The parser context for the object commit.
	 * @returns {boolean} - true if the object is valid and may be committed, false otherwise.
	 */
	commit (parser) {
		console.log("generic commit of type " + this.type);
		return true;
	}
	/**
	 * Returns a label to be used for display - either the item's explicit label
	 * or a derived value. By default, this uses the item's name if the label is empty.
	 * @returns {string} - the display label.
	 */
	getLabel()
	{
		return this.label==""?this.name:this.label;
	}
	/**
	 * Generates code representing this item's current non-volatile state,
	 * which, when parsed, will result in a copy of this item.
	 * @param {number} indent_level - a starting indent level.
	 * @returns 
	 */
	toCode(indent_level = 0)
	{
		let output ="";

		
		this.subItems.forEach((item) => {
			output+=item.toCode(indent_level + 1);
		});
		return output;
	}

	//**** updating the object */

	/**
	 * Recalculates this item's bounding box.
	 */
	updateSize () {
		this.subItems.forEach((item) => {
			item.updateSize();
		});
	}
	/**
	 * Recalculates this item's effective position.
	 */
	updatePosition () {
		this.subItems.forEach((item) => {
			item.updatePosition();
		});
	}

	//******* Rendering */

	/**
	 * Renders this object's graphical representation onto given Canvas.
	 * @param {CanvasRenderingContext2D} ctx - The candvas to render to.
	 */
	draw (ctx) {
		// default to not drawing anything if item is hidden.
		if(this.collapseView)
		{
			return;
		}
		this.subItems.forEach((item) => {
			item.draw(ctx);
		});
	}
	/**
	 * Renders the object, gets called when the object needs to be rendered
	 * on the top layer.
	 * @param {CanvasRenderingContext2D} ctx - the canvas to render to. 
	 */
	drawTop(ctx)
	{
		// default to not drawing anything if item is hidden.
		if(this.collapseView)
		{
			return;
		}
		this.subItems.forEach((item) => {
			item.drawTop(ctx);
		});
	}
	/**
	 * Renders the object's collapsed form if applicable.
	 * @param {CanvasRenderingContext2D} ctx - the canvas to render to. 
	 */
	drawCollapsed(ctx) {
		// default to drawing the object normally
		if(this.collapseState)
		{
			this.draw(ctx);
		}
		this.subItems.forEach((item) => {
			item.drawCollapsed(ctx);
		});
	}
	/**
	 * Draws the outline, by default it is the item's
	 * hitbox. This is the function to be replaced in case a different
	 * outline is needed for a specific type of item.
	 * This function should only issue draw commands
	 * without changing any context parameters like styles.
	 * This function should only concern drawing this specific
	 * item's outline - for highlighting additional items
	 * depending on this item, see highlightGroup
	 * @param {CanvasRenderingContext2D} ctx - The canvas context.
	 */
	drawOutlineFunc (ctx) {
		let rect = this.getRect(true);
		ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
	}
	/**
	 * Draws this object's outline using the provided style.
	 * @param {CanvasRenderingContext2D} ctx - The canvas context.
	 * @param {object} lineStyle - An object containing properties to set on the canvas object.
	 * for drawing the outline, such as stroke colour or line width.
	 */
	drawOutline (ctx, lineStyle) {
		// apply any specified line styles and save the props
		ctx.save();
		for (let styleItem in lineStyle) {
			ctx[styleItem] = lineStyle[styleItem];
		}
		// call the line drawing func
		this.drawOutlineFunc(ctx);
		// restore styles
		ctx.restore();
	}
	/**
	 * Used to get any items that should be highlighted when this
	 * item is highlighted. The default implementation returns
	 * an array consisting of just this item.
	 * @returns {VisualItem[]} - The array containing items to be highlighted.
	 */
	getDrawingGroup () {
		return [this];
	}
	/**
	 * Draws this object highlighted (outlined) with a given style, including
	 * any related objects that should be highlighted along with it.
	 * @param {CanvasRenderingContext2D} ctx - The canvas context.
	 * @param {object} lineStyle - An object containing properties to set on the canvas object.
	 */
	drawHighlight (ctx, lineStyle) {
		if(this.collapseView)
		{
			return;
		}
		const group = this.getDrawingGroup();
		group.forEach((item) => {
			item.drawOutline(ctx, lineStyle);
		});
	}
	/**
	 * Checks if this item collides with the specified coordinates.
	 * @param {number} x - the X coordinate to test
	 * @param {number} y - the Y coordinate to test
	 * @returns {boolean} - true if the item collides, false otherwise.
	 */
	testHit(x,y)
	{
		// do not collide hidden items
		if(this.collapseView )
		{
			return false;
		}
		// by default just test against the item's bounding box
		return this.getRect().contains(x,y);
	}
	/**
	 * Hides the item and its subitems.
	 */
	setCollapseView()
	{
		this.collapseView = true;
		this.subItems.forEach((item)=>
		{
			item.setCollapseView();

		});
	}
	/**
	 * Unhides the item and its subitems.
	 */
	clearCollapseView()
	{
		this.collapseView = false;		
		this.subItems.forEach((item)=>
		{
			item.clearCollapseView();

		});
	}
	/**
	 * Toggles the item's visibility.
	 */
	toggleCollapseView()
	{
		this.collapseView ? this.clearCollapseView() : this.setCollapseView();
	}
	/**
	 * Collapses the item, setting it to collapsed state and hiding its contents.
	 */
	collapse()
	{
		this.collapseState = true;
		// override selection priority to make it easier to select
		this.overrideSO = 100;
		// hide, not collapse, any contents
		if(this.subItems.length > 0)
		{
			this.subItems.forEach((item)=>
			{
				item.setCollapseView();
			});
		}
		// do a refresh since the item's dimensions may have changed
		this.updateSize();
		this.updatePosition();
	}
	/**
	 * Uncollapses the item, setting it to normal state and unhiding its contents.
	 */
	uncollapse()
	{
		this.collapseState = false;
		// reset selection priority to default
		this.overrideSO = 0;
		// unhide the contents, not affecting explicit collapse state
		if(this.subItems.length > 0)
		{
			this.subItems.forEach((item)=>
			{
				item.clearCollapseView();
			});
		}
		// do a refresh since the item's dimensions may have changed
		this.updateSize();
		this.updatePosition();
	}
}


/**
 * A skeleton class mainly existing for
 * the boilerplate to copypaste when a new item
 * type is created.
 */
class VisualTEMPLATE extends VisualItem {
	constructor(line, name)	{
		super("tpl", name, line);
		this.from = null;
		this.to = null;
	}
	updateSize()
	{
		super.updateSize();
		
	}
	updatePosition()
	{

		super.updatePosition();
	}
}

/**
 * Container for fixed installations, parent item for Locations
 */
class VisualMap extends VisualItem {
	constructor(name)
	{
		super("map", name);
	}
}

/**
 * Represents a fixed location grouping racks and other such items.
 */
class VisualLocation extends VisualItem {
	constructor(map, name)
	{
		super("location", name, map);
		this.selectionOrder = 1;

	}
	
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("location",indent_level,this.name);
		// actually stores the position
		output+=this._f("position",indent_level+1, this.x, this.y);
		output+=this._f("label", indent_level+1, this.label);
		// compact/collapse state is also stored as 
		// compact locations are useful for visualising
		// unimportant/less relevant items
		if(this.collapseState)
		{
			output+=this._f("compact", indent_level+1, "");
		}
		return output+super.toCode(indent_level);
	}
	
	commit(parser)
	{
		// must have a name, rest is optional
		if(!this.name)
		{
			parser.warn(WARN_LOCATION_NO_NAME);
			return false;
		}
		if(!this.label)
		{
			parser.warn(WARN_LOCATION_NO_LABEL);
		}
		// run the collapse function if it starts out collapsed
		if(this.collapseState)
		{
			this.collapse();
		}
		return true;
	}

	updatePosition()
	{
		// top level item, so renders at actual coordinates
		this.cX = this.x;
		this.cY = this.y;
		super.updatePosition();
	}

	updateSize() 
	{
		if(this.collapseState)
		{
			// render a collapsed location tall enough to show its label
			this.height = DIM_RACK_LABEL_SIZE + DIM_RACK_SPACING;
			this.width = DIM_COLLAPSED_WIDTH;
			super.updateSize();
			// exit
			return;
		}
		// for full size, calculate height based
		// on the tallest rack contained
		let maxh=0;
		this.subItems.forEach((item)=>{
			// make sure each rack first calculates its size
			item.updateSize();
			maxh = maxh < item.height ? item.height : maxh;
		});
		// width is based on the number of racks
		this.width = this.subItems.length * (DIM_RACK_WIDTH+DIM_RACK_SPACING) + DIM_RACK_SPACING;
		this.height = maxh + DIM_RACK_LABEL_SIZE*2;
	}
	draw(ctx) 
	{
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.fillStyle = "white";
		// draw a simple rectangle
		const rect = this.getRect();
		ctx.fillRect(rect.x+0.5, rect.y+0.5, rect.width, rect.height);
		ctx.strokeRect(rect.x+0.5, rect.y+0.5, rect.width, rect.height);
		// draw the label
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.font ="20px monospace";
		ctx.fillText(this.label, rect.x+rect.width/2, rect.y+DIM_RACK_SPACING-3);
		// if collapsed, don't draw anything inside
		if(this.collapseState == true)
		{
			return;
		}
		super.draw(ctx);
	};
}
/**
 * Represents a single rack of equipment (Frames)
 */
class VisualRack extends VisualItem {
	constructor(location, name)
	{
		super("rack", name, location);
		// standard width
		this.width = DIM_RACK_WIDTH;
		// if not set later, will be dynamically assigned
		this.slot = -1;
		this.selectionOrder = 2;
	}
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("rack",indent_level,this.name);
		// #TODO: keep track if the slot was originally assigned
		// and only write it here if it was
		output+=this._f("slot",indent_level+1, this.slot+1);
		output+=this._f("label", indent_level+1, this.label)
		return output+super.toCode(indent_level);
	}
	commit(parser)
	{
		if(!this.name)
		{
			parser.warn(WARN_LOCATION_NO_NAME);
			return false;
		}
		if(!this.label)
		{
			parser.warn(WARN_LOCATION_NO_LABEL);
		}
		// assign a slot to every frame that doesn't
		// have one explicitly set
		if(this.subItems.length>0)
		{
			this.subItems.forEach((item)=>{
				if(item.slot === -1)
				{
					item.slot = this.getNextSlot();
				}
			});
		}
		return true;
	}
	updateSize()
	{
		super.updateSize();
		// currently the height just depends on the amount of frames
		// #TODO: account for explicit slots
		this.height = this.subItems.length * (DIM_FRAME_BOTTOM+DIM_FRAME_HEIGHT) + DIM_RACK_LABEL_SIZE;
		this.width = DIM_RACK_WIDTH;
		// needed to propagate change to the sockets
		// so that the lines attached render in a reasonable location
		if(this.collapseView)
		{
			this.height = 1;
			this.width = 1;
		}
	}
	updatePosition()
	{
		// calculate ofset based on this rack's slot
		this.cX = this.x + this.parent.cX + this.slot * (this.width + DIM_RACK_SPACING) + DIM_RACK_SPACING;
		this.cY = this.y + this.parent.cY + DIM_RACK_LABEL_SIZE;
		// if location is collapsed, place roughly in the top middle
		if(this.collapseView)
		{
			this.cX = this.parent.cX + DIM_COLLAPSED_WIDTH/2;
			this.cY = this.parent.cY + 1;
		}
		super.updatePosition();
	};
	draw(ctx) 
	{
		// nothing is drawn in collapsed view
		if(this.collapseView)
		{
			return;
		}
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "black";
		// draw a rectangle
		const rect = this.getRect();
		ctx.strokeRect(rect.x+0.5, rect.y+0.5, rect.width, rect.height);
		ctx.font ="20px monospace";
		// draw label
		ctx.fillText(this.label, rect.x+this.width/2, rect.y+DIM_RACK_SPACING - 3);
		super.draw(ctx);
	}
}
/**
 * A frame contains sockets to connect wires to
 */
class VisualFrame extends VisualItem
{
	constructor(rack, name)
	{
		super("frame", name, rack);
		this.selectionOrder = 3;
		// standard sizes
		this.height = DIM_FRAME_HEIGHT + DIM_FRAME_BOTTOM;
		this.width = DIM_RACK_WIDTH;
		// defaults to dynamic assignment
		this.slot = -1;
		// contains the template used for the frame
		this.frametype = "";
		// contains any socket labels on sockets in this frame
		this.socketlabels = {};
	}
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("frame",indent_level,this.name);
		//#TODO: only write this if a slot was specified in original file
		output+=this._f("slot",indent_level+1, this.slot+1);
		output+=this._f("type",indent_level+1, this.frametype);
		output+=this._f("label", indent_level+1, this.label);
		// sockets aren't stored in the file
		// any custom labels are stored with the frame
		this.subItems.forEach(socket => {
			if(socket.label!="")
			{	
				output+=this._f("socketlabel", indent_level+1, socket.name, socket.label);
			}
		});
		return output;
	}
	commit(parser)
	{
		if(!this.name)
		{
			parser.warn(WARN_LOCATION_NO_NAME);
			return false;
		}
		if(!this.label)
		{
			parser.warn(WARN_LOCATION_NO_LABEL);
		}
		// get the template
		let ftpl = parser.inventory.find(this.frametype);
		// reject the frame if the template reference is invalid
		if(!ftpl || ftpl.type!="frame_tpl")
		{
			parser.statevars['frame_tpl_name'] = this.frametype;
			parser.warn(WARN_BAD_FRAME_TPL);
			return false;
		}
		// add sockets from the template
		ftpl.elements.forEach((el)=>{
			switch(el.type)
			{
				// connectors are added directly
				case "connector":
				{
					let connref = parser.inventory.find(el.name);
					// make sure connector is valid
					if(!connref)
					{
						// this only fails the specific socket, not the whole frame
						return false;
					}
					let slot = this.getNextSlot();
					// #TODO: more clear numbering system
					// currently slots are 0-indexed internally but 1-indexed
					// for naming and display
					let conn = new VisualSocket(this, (slot+1).toString());
					conn.slot = slot;
					// the renderer is a subItem named "main"
					conn.renderer = connref.find("main");
					conn.width = connref.width;
					conn.height = connref.height;
					conn.x = el.x;
					conn.y = el.y;
					this.addItem(conn);
					break;
				}
				// banks are collections of connectors
				case "bank":
				{
					let bankref = parser.inventory.find(el.name);
					// validate the bank reference
					if(!bankref)
					{
						return false;
					}
					// same as the parent loop, go through each connector
					bankref.elements.forEach((el2)=>{
						let connref = parser.inventory.find(el2.name);
						if(!connref)
						{
							return false;
						}
						let slot = this.getNextSlot();
						let conn = new VisualSocket(this, (slot+1).toString());
						conn.slot = slot;
						conn.renderer = connref.find("main");
						conn.width = connref.width;
						conn.height = connref.height;
						conn.x = el2.x + el.x;
						conn.y = el2.y + el.y;
						this.addItem(conn);
					});
				}
				// any unexpected types are ignored
				default:
				{
					return;
				}
			}
		});
		// apply any custom labels
		this.subItems.forEach((socket)=>{
			if(this.socketlabels[socket.name])
			{
				socket.label = this.socketlabels[socket.name];
			}
		});
		return true;
	}

	updateSize()
	{
		super.updateSize();
		// standard size
		this.height = DIM_FRAME_HEIGHT + DIM_FRAME_BOTTOM;
		this.width = DIM_RACK_WIDTH;
		// unless collapsed
		if(this.collapseView)
		{
			this.height = 1;
			this.width = 1;
		}
	}
	updatePosition()
	{
		this.cX = this.x + this.parent.cX;
		// vertical position based on slot
		this.cY = this.y + this.parent.cY + this.slot * (this.height + DIM_FRAME_SPACING) + DIM_RACK_LABEL_SIZE;
		// if collapsed, every frame is at the same point
		// needed to force the sockets in the same spot for
		// wire visualisation when collapsed
		if(this.collapseView)
		{
			this.cX =this.parent.cX;
			this.cY = this.parent.cY;
		}
		super.updatePosition();
	}
	draw(ctx) 
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "black";
		const rect = this.getRect();
		// draw a rectangle of standard size
		// plenty of padding on the sides and bottom
		ctx.strokeRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH, DIM_FRAME_HEIGHT);
		ctx.font ="20px monospace";
		// label on the bottom
		ctx.fillText(this.label, rect.x+this.width/2, rect.y+this.height-DIM_FRAME_SPACING/2 -7);
		// name on the left - should be a short numeric ID
		ctx.fillText(this.name, rect.x + DIM_FRAME_SIDES/2, rect.y + DIM_FRAME_HEIGHT-10);
		super.draw(ctx);
	}
	drawTop(ctx)
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "white";
		const rect = this.getRect();
		// fill a white background to override items underneath
		ctx.fillRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH, DIM_FRAME_HEIGHT);
		ctx.strokeRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH, DIM_FRAME_HEIGHT);
		super.drawTop(ctx);
	}
}
/**
 * Sockets are inside frames and have wires connected to them
 */
class VisualSocket extends VisualItem
{
	/**
	 * List of wires currently connected
	 */
	connections = [];
	/**
	 * Renderer assigned to the socket.
	 */
	renderer = null;
	/**
	 * stores the connector's type name (such as RJ45 or SC)
	 */
	typename = "generic";
	constructor(frame, name)
	{
		super("socket", name, frame);
		this.selectionOrder = 5;
	}
	getLabel()
	{
		// if no label, shows as "5", if label is applied, shows as "(5) label"
		return this.label==""?this.name : "(" + this.name + ") " + this.label;
	}
	updateSize()
	{
		super.updateSize();
	}
	updatePosition()
	{
		// #TODO: fix the hardcoded value for the various offsets used here
		this.cX = this.x + this.parent.cX + DIM_FRAME_SIDES + 5;
		this.cY = this.y + this.parent.cY + 2;
		// if inside collapsed item, stick it to the top left of the item
		if(this.collapseView)
		{
			this.cX =this.parent.cX;
			this.cY = this.parent.cY;
		}
		super.updatePosition();
	}
	draw(ctx) 
	{
		// fill out the socket's dimensions with white background
		ctx.fillStyle="#FFFFFF";
		ctx.fillRect(this.cX+0.0,this.cY+1,this.width,this.height-1);
		// draw markers indicated connected lines if any
		const lines = this.connections.length;
		for(let i=0;i<lines;i++)
		{
			ctx.lineWidth = 4;
			ctx.beginPath();
			// the Y coordinate here splits the socket's height between each
			// distinct line
			// 1 line draws from 0.0 to 1.0
			// 2 lines draw from 0.0 to 0.5 and from 0.5 to 1.0
			// etc
			ctx.moveTo(this.cX+2,this.cY + Math.floor(i* this.height/lines));
			ctx.lineTo(this.cX+2,this.cY + Math.floor((i+1)* this.height/lines));
			ctx.strokeStyle = this.connections[i].parent.colour1;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.cX+this.width-3,this.cY + Math.floor(i* this.height/lines));
			ctx.lineTo(this.cX+this.width-3,this.cY + Math.floor((i+1)* this.height/lines));
			ctx.strokeStyle = this.connections[i].parent.colour2;
			ctx.stroke();
		}
		// run the renderer to draw the actual socket
		const rr = new ItemRenderer(ctx, this.renderer.instructions);
		rr.render(this);
	}
	drawTop(ctx)
	{
		this.draw(ctx);
	}
	/**
	 * Connects a given wire to the socket
	 * @param {VisualPatch} wire 
	 */
	connect(wire)
	{
		console.log("connected <", wire.getFullLabel(),"> to <", this.getFullLabel(), ">");
		this.connections.push(wire);
	}
	/**
	 * Disconnects a given wire from the socket
	 * @param {VisualPatch} wire 
	 */
	disconnect(wire)
	{
		console.log("disconnected <", wire.getFullLabel(),"> from <", this.getFullLabel(), ">");
		this.connections = this.connections.filter(item=>item!==wire);
	}
	/**
	 * Checks if the wire is connected to this socket and can be moved
	 * @param {VisualPatch} wire - wire to check
	 * @returns {boolean}
	 */
	canMove(wire)
	{
		return (wire.to == this || wire.from == this);
	}
	/**
	 * Checks if a connection from a given wire's Line can be added to the socket
	 * In effect, checks if the Line already exists on the socket
	 * @param {VisualPatch} wire 
	 * @returns 
	 */
	canAdd(wire)
	{
		const results = this.connections.filter(item=>item.parent == wire.parent);
		return results.length == 0;
	}
	/**
	 * Checks if a wire's Line can be extended to this socket
	 * @param {VisualPatch} wire 
	 * @returns 
	 */
	canStart(wire)
	{
		const results = this.connections.filter(item=>item.parent == wire.parent);
		return results.length ==1;
	}
	getDrawingGroup()
	{
		// when highlighting the socket, also highlight any wires attached
		return [this, ...this.connections];
	}
	/**
	 * Disconnects a wire from the given socket, and the other wire that belongs to the same line
	 * as the supplied reference wire. Then, attaches both to this socket.
	 * If no other wire is attached, then only the given wire is moved.
	 * @param {VisualPatch} other - the socket to disconnect from
	 * @param {VisualPatch} wire - wire to disconnect
	 */
	takeFrom(other, wire)
	{
		// determine if the wire starts or ends at this socket
		let thisIsFrom = wire.from == other;
		let otherWire = null;
		// first, remove the wire from the target socket
		other.disconnect(wire);
		// find the other link on same connection
		otherWire = other.connections.find((item)=>item.parent.name == wire.parent.name);
		// assign the wires' endpoints as applicable
		this.connect(wire);
		if(thisIsFrom)
		{
			wire.from = this;
		}
		else
		{
			wire.to = this;
		}
		if(otherWire)
		{
			if(thisIsFrom)
			{
				otherWire.to = this;
			}
			else
			{
				otherWire.from = this;
			}
			other.disconnect(otherWire);
			this.connect(otherWire);
		}
	}
}



/**
 * Top-level container for all the wiring articles and other "movable" items
 */
class VisualLineMap extends VisualItem
{
	constructor(name){
		 super("linemap", name, null);
		}

}
/**
 * Defines a "line" - a contiguous set of wire links with two defined end points.
 */
class VisualLine extends VisualItem {

	/**
	 * One of the two colours making up the line's colour code
	 */
	colour1 = "#808080";
	/**
	 * One of the two colours making up the line's colour code
	 */
	colour2 = "#808080";
	
	constructor(map, name) {
		super("line", name, map);
	}
	
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("line",indent_level,this.name);
		output+=this._f("colour1",indent_level+1, this.colour1);
		output+=this._f("colour2",indent_level+1, this.colour2);
		// only write the label if actually set
		if(this.label!="")
		{
			output+=this._f("label", indent_level+1, this.label)
		}
		return output+super.toCode(indent_level);
	}
	getDrawingGroup()
	{
		const grp = [];
		// the line itself has no highlighting
		// instead, highlight all its links
		// technically, each socket bar endpoints is highlighted twice
		// this is okay
		this.subItems.forEach((item)=>{
			grp.push(...item.getDrawingGroup());
		});
		return grp;
	}

	commit(parser)
	{
		// walk thorough the entire line, ensuring all links
		// are in the correct order and detecting any anomalies
		
		// keep track of sockets seen as a link's starting or ending point
		let seenFroms = [];
		let seenTos = [];
		// also keep track of which points have been seen before
		let seenConnections = [];
		// go through every item, noting down the points visited by each link
		this.subItems.forEach((link)=>{
			// get the endpoints
			let thisFrom = link.from;
			let thisTo = link.to;
			// if any endpoints are missing, that link is bad
			if(!thisFrom || !thisTo)
			{
				parser.warn(WARN_BAD_LINK);
				// skip the bad link
				return false;
			}
			// if the endpoint is already in the list, remove it
			if(seenConnections.find((conn)=>conn === thisFrom))
			{
				seenConnections = seenConnections.filter((conn2)=>conn2 !== thisFrom);
			}
			// else add it to the list
			// any connection seen an even amount of times will be gone
			// any odd amount will remain
			else
			{
				seenConnections.push(thisFrom);
			}
			// do the same as above
			if(seenConnections.find((conn)=>conn === thisTo))
			{
				seenConnections = seenConnections.filter((conn2)=>conn2 !== thisTo);
			}
			else
			{
				seenConnections.push(thisTo);
			}
			
			// log all connections
			seenFroms.push(thisFrom);
			seenTos.push(thisTo);
		});
		// in a properly formed line, there should be exactly two endpoints that
		// are each visited only by one link - the start and the end
		console.log(seenConnections);
		if(seenConnections.length !=2)
		{
			// malformed line
			// #TODO: something
		}
		else
		{
			// determine start point
			let firstPoint = null;
			let lastPoint = null;
			let currentPoint = null;
			let nextPoint = null;
			// clone the array of links
			let availableLinks = this.subItems.slice();
			// pick one of the remaining points as the start 
			// this is not 100% reliable as there may be cases where
			// both points are a start point for a link or both are an end point
			// but this is a sane heuristic
			if(seenFroms.find((conn)=>conn == seenConnections[0]))
			// [0] is the start
			{
				firstPoint = seenConnections[0];
				lastPoint = seenConnections[1];
			}
			else
			{
				firstPoint = seenConnections[1];
				lastPoint = seenConnections[0];
			}
			// begin with the starting point
			currentPoint = firstPoint;
			// init a link number counter
			let linkIdCounter = 0;		   // |v|   a sensible safeguard        |v|
			while(currentPoint!==lastPoint && linkIdCounter < this.subItems.length)
			{
				// find a link that connects to the current point
				let linked = availableLinks.filter((link)=>
					(link.to === currentPoint || link.from ===currentPoint)
					);
				if(linked.length<1)
				{
					// discontinuity??
					break;
				}
				if(linked.length>1)
				{
					// some other discrepancy, branching?
					break;
				}
				// else should only be one link, use it
				let currentLink = linked[0];
				// designate the other end of the link as the next point
				nextPoint = currentLink.from === currentPoint ? currentLink.to : currentLink.from;
				// pick the link out
				currentLink.unlink();
				// connect the link in correct direction
				currentLink.from = currentPoint;
				currentLink.to = nextPoint;
				// this notifies the sockets of the connection changes
				currentLink.commit(parser);
				// number the link
				currentLink.name = linkIdCounter;
				// advance to the next point
				currentPoint = nextPoint;
				// remove the newly processed link from the candidates
				availableLinks = availableLinks.filter((link)=>link!==currentLink);
				// increment the link number
				linkIdCounter++;
				console.log("renumbered", currentLink, "to ", linkIdCounter-1);
			}
		// put the links in the new order inside the Line
		this.subItems.sort((a,b)=>a.name - b.name);
		}
		return true;
	}
	/**
	 * Finds a link between two specified sockets
	 * @param {VisualSocket} socket1 
	 * @param {VisualSocket} socket2 
	 * @returns {VisualPatch?} - a link if one is found in this Line 
	 */
	getLinkBetween(socket1, socket2)
	{
		// check both directions
		return this.subItems.find((link)=>
		(link.to === socket1 && link.from ===socket2)
		|| (link.to === socket2 && link.from ===socket1)
		);
	}
	/**
	 * Finds any links in this Line that connect to the specified socket.
	 * @param {VisualSocket} socket 
	 * @returns {VisualPatch[]} - an array containing any links found 
	 */
	getLinksVisiting(socket)
	{
		return this.subItems.filter((link)=>
		(link.to === socket || link.from ===socket)
		);
	}
}

/**
 * Represents a single connection (link, wire) between two endpoints (sockets).
 */
class VisualPatch extends VisualItem {
	/**
	 * The start point of this link.
	 */
	from = null;
	/**
	 * The end point of this link.
	 */
	to = null;
	/**
	 * An optional name of a bundle, cable or other group associated with this link.
	 */
	cable ="";

	constructor(line, name)	{
		super("patch", name, line);
		this.selectionOrder = 4;
	}
	
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("link",indent_level,this.name);
		// write the label if one is set
		if(this.label!="")
		{
			output+=this._f("label", indent_level+1, this.label)
		}
		output+=this._f("from",indent_level+1, this.from.getFullName(" ").substring(10));
		output+=this._f("to",indent_level+1, this.to.getFullName(" ").substring(10));
		output+=this._f("cable", indent_level+1, this.cable)
		return output;
	}
	getLabel()
	{
		// if the link has a label, include its number in the display string
		return this.label==""?this.name : "(" + this.name + ") " + this.label;
	}
	commit(parser)
	{
		// fail the link if either or both endpoints are not set
		if(!this.to || !this.from)
		{
			parser.warn(WARN_BAD_LINK);
			return false;
		}
		// notify both endpoints of the connection
		this.to.connect(this);
		this.from.connect(this);
		return true;
	}
	/**
	 * Disconnects this link from its endpoints.
	 */
	unlink()
	{
		this.to.disconnect(this);
		this.from.disconnect(this);
		this.to = null;
		this.from = null;
	}
	updateSize()
	{
		super.updateSize();
	}
	updatePosition()
	{
		// define a rectangle from the endpoints
		const startX = this.from.cX;
		const startY = this.from.cY;
		const endX = this.to.cX + this.to.width;
		const endY = this.to.cY + this.to.height;
		// normalise the rectangle, making it have strictly positive width and height
		// this is done by picking the smallest of each coordinate
		this.cX = startX > endX ? endX : startX;
		this.cY = startY > endY ? endY : startY;
		// the line representing the link is one of the diagonals of the rectangle.
		// if both X and Y increase or decrease, that diagonal is from top-left to bottom-right
		// if their signs are different, the diagonal is "flipped".
		// in the following diagram, 4 links are illustrated
		// (O) is the starting point, and A, B, C, D are endpoints of 4 links
		// NB: the Y axis goes downwards in this coordinate system!
		//                                
		//           y-                        All 4 links have the exact same width and height calculated
		//           |                         for the bounding rectangle. The normalisation process moves
		//        A--b--B                      the coordinates then to match up to the original points. 
		//        |\ | /|					   Only the link OD remains unchanged here, as D has higher X and Y
		//        | \|/ |                      coordinates than O. OA switches the points around - A is the
		// x-  ---n--O--m----------> x+        starting coordinate for the rectangle now and it ends at O.
		//        | /|\ |                      The remaining two links create new points - OB becomes bm and
		//        |/ | \|                      OC becomes nc - but the "regular" diagonal is pointing the wrong
		//        C--c--D                      way, which is handled in the collision function.
		//           | 
		//           v
		//
		//           y+
		//         
		const dX = endX - startX;
		const dY = endY - startY;
		// fortunately, it easy to check if that's the case - the diagonal
		// only "flips" if exactly one of the pair of differences is negative
		// meaning the product of these difference is negative
		this.flip = (dX*dY) < 0;
		// set the resulting rectangle's size to the absolute value of the differences.
		this.width = Math.abs(dX);
		this.height = Math.abs(dY);
		super.updatePosition();
	}

	testHit(x, y)
	{
		// as a link is a line between two corners of its bounding rectangle,
		// test for the diagonal collision (selecting the "flipped" diagonal 
		// if determined by the code in the updatePosition method)
		return this.getRect().diagonal(x, y, 6, this.flip);
	}
	draw(ctx)
	{
		// save the drawing settings to restore later
		ctx.save();

		ctx.lineWidth = 3;
		// this controls how far the 2 lines will "spread" from the centreline
		let offset = 3;
		let vertical_margin = 3
		// determine the starting and ending points for the centreline
		// aim for the centreline of the sockets
		let startX = this.from.cX + (this.from.width/2);
		let endX = this.to.cX + (this.to.width/2);
		// starts at the top of the sockets, with a small hardcoded margin
		let startY = this.from.cY + vertical_margin;
		// ends at the bottom with the same margin
		let endY = this.to.cY + this.to.height - vertical_margin;
		// determine the angle (respective to the X axis)
		let angle = Math.atan2(endY-startY, endX-startX);
		// technically we are rotating the vector [0, offset] by the rotation matrix from the angle
		//
		//     [cos(θ) -sin(θ)]  [x]  =>    [x * cos(θ) - y * sin(θ)]
		//     [sin(θ)  cos(θ)]  [y]  =>    [x * sin(θ) + y * cos(θ)]
		//
		//
		// we get away with only doing half of the rotation matrix, as the X value is 0
		// 
		//   [x] => [-y * sin(θ)]
		//   [y] => [ y * cos(θ)]
		let rotX = -1 * (Math.sin(angle)) * offset;
		let rotY = Math.cos(angle) * offset;
		// draw the first line
		ctx.beginPath();
		ctx.moveTo(startX + rotX, startY+rotY);
		ctx.lineTo(endX + rotX,endY+rotY);
		ctx.strokeStyle =this.parent.colour1;
		ctx.stroke();
		ctx.beginPath();
		// flipping both coordinates of the offset is the same as rotating it by 180 degrees
		// which is conveniently the same as reflecting it 
		// which results in the second line being nicely positioned at the other side 
		ctx.moveTo(startX - rotX, startY-rotY);
		ctx.lineTo(endX - rotX,endY-rotY);
		ctx.strokeStyle =this.parent.colour2;
		ctx.stroke();
		// restore settings
		ctx.restore();
	}
	drawOutlineFunc(ctx)
	{
		// draw a single line right in the middle
		ctx.beginPath();
		ctx.moveTo(this.from.cX+(this.to.width/2), this.from.cY+3);
		ctx.lineTo(this.to.cX+(this.to.width/2),this.to.cY+this.to.height-3);
		ctx.stroke();

	}
	getDrawingGroup()
	{
		// highlight both endpoints along with the link
		return [this.from,this,this.to];
	}
}

/**
 * Represents a renderer definition for a socket type
 * Currently is a dummy to capture the data for the renderer class
 */
class VisualRenderer extends VisualItem {
	instructions = [];
	constructor(parent, name)
	{
		super("renderer",name, parent);
	}

}
/**
 * Represents a connector template
 */
class VisualConnectorTemplate extends VisualItem {
	constructor(parent, name)
	{
		super("socket_tpl",name, parent);
	}
}

/**
 * Represents a connector bank - a collection of connectors
 */
class VisualConnectorBank extends VisualItem {
	elements = [];
	constructor(parent, name)
	{
		super("socket_bank",name, parent);
	}
}
/**
 * Represents a frame template
 */
class VisualFrameTemplate extends VisualItem {
	elements = [];
	constructor(parent, name)
	{
		super("frame_tpl", name, parent);
	}
}
/**
 * Top-level item containing the various templates
 */
class VisualInventory extends VisualItem {
	constructor(name)
	{
		super("inventory",name, null);
	}

}



/// helpful rectangle for collisions
function GetRect(x, y, w, h) {

    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
	this.flip = false;

    this.contains = function (x, y) 
	{
        return this.x <= x 
			&& this.x + this.width > x 
			&& this.y <= y 
			&& this.y + this.height > y;
    };
	this.overlaps = function(rect)
	{
		return this.x <= rect.x + rect.width 
			&& this.x + this.width > rect.x
			&& this.y <= rect.y + rect.height
			&& this.y + this.height > rect.y;
	};
	this.diagonal = function(x, y, tolerance, flip)
	{
		if(this.height == 0 || this.width == 0)
		{
			console.log("aargh");
			return true;
		}
		oX = x-this.x;
		if(flip)
			oX = this.width-oX;
		oY = y-this.y;
		//console.log(oX + " " + oY);
		ratio = this.height/this.width;
		expectedY = oX*ratio;
		expectedX = oY / ratio;
		deviation1 = Math.abs(expectedY - oY);
		deviation2 = Math.abs(expectedX - oX);
		//console.log(oX + "-"+expectedX+"="+deviation2 + " >< " + oY + "-"+expectedY+"="+deviation1);
		return deviation1 < tolerance || deviation2 < tolerance;
	};

    this.draw = function (ctx) {
        ctx.rect(this.x, this.y, this.width, this.height)
    };
};