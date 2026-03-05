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

	getAtSlot(slot) {
		return this.subItems.find((subItem) => { return subItem.slot === slot; });
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
		VisualEditor.drawCallCount++;
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