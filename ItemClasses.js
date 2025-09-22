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

	static hitboxMapping = [];

	x = 0;
	y = 0;
	cX = 0;
	cY = 0;
	height = 1;
	width = 1;
	selectionOrder = 0;
	overrideSO = 0;
	label = "";
	subItems = [];
	name = "";
	parent = null;
	type = "";
	nextSlot = 0;
	flip = false;
	collapseState = false;
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
		const current = this.nextSlot;
		let newSlot = current + 1;
		while (this.checkSlot(newSlot)) {
			newSlot++;
		}
		this.nextSlot = newSlot;
		return current;
	}
	/**
	 * Checks if a given numeric ID is in use.
	 * @param {int} slot - the ID to check.
	 * @returns - true if ID is in use, false otherwise.
	 */
	checkSlot (slot) {
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

	getFullLabel()
	{
		if(!this.parent)
		{
			return this.label==""?this.name:this.label;
		}
		return this.parent.getFullLabel() + " / " + (this.label==""?this.name:this.label);
	}

	updateHitboxMapping()
	{
		let hitboxRef = VisualItem.hitboxMapping.find((hitbox)=>hitbox.item === this);
		if(!hitboxRef)
		{
			hitboxRef = {};
			VisualItem.hitboxMapping.push(hitboxRef);
		}
		hitboxRef.item = this;
		hitboxRef.level = Math.max(this.selectionOrder, this.overrideSO);
		hitboxRef.hitbox = this.getRect();
		hitboxRef.label = this.getFullLabel();
		this.subItems.forEach((item) => {
			item.updateHitboxMapping();
		});
		
	}


	getOrigin () {
		let result = { x: this.x, y: this.y };
		if (this.parent) {
			let pO = this.parent.getOrigin();
			result.x += pO.x;
			result.y += pO.y;
		}
		return result;
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
		if(this.collapseView)
		{
			return;
		}
		//ctx.clearRect(0,0,1024,1024);
		/*
		ctx.strokeStyle = "green";
		ctx.lineWidth = 3;
		const rect = this.getRect();
		ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
		*/
		this.subItems.forEach((item) => {
			item.draw(ctx);
		});
	}
	drawCollapsed(ctx) {
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
		const group = this.getDrawingGroup();
		group.forEach((item) => {
			item.drawOutline(ctx, lineStyle);
		});
	}
	/**
	 * 
	 */
	testHit(x,y)
	{
		if(this.collapseView)
		{
			return false;
		}
		//console.log(x,y);
		return this.getRect().contains(x,y);
	}
	
	setCollapseView()
	{
		this.collapseView = true;
		
			this.subItems.forEach((item)=>
			{
				item.setCollapseView();

			});
	}
	clearCollapseView()
	{
		this.collapseView = false;
		
			this.subItems.forEach((item)=>
			{
				item.clearCollapseView();

			});
	}

	uncollapse(cascade = false)
	{

		this.collapseState = false;
		this.overrideSO = 0;
		//this.collapseView = true;
		if(this.subItems.length > 0)
		{
			this.subItems.forEach((item)=>
			{
				item.clearCollapseView();

			});
		}
		this.updateSize();
		this.updatePosition();

	}
	
	collapse(cascade = false)
	{
		
		this.collapseState = true;
		this.overrideSO = 100;
		//this.collapseView = true;
		if(this.subItems.length > 0)
		{
			this.subItems.forEach((item)=>
			{
				item.setCollapseView();

			});
		}
		this.updateSize();
		this.updatePosition();
		
	}
}



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



class VisualMap extends VisualItem {
	constructor(name)
	{
		super("map", name);

	}
}

function __VisualMap(name)
{
	let newobj = new VisualItem("map", name, null);
	newobj.find = function(location, rack, frame, connector)
	{
		console.log("aaaaa", arguments);
		let result = newobj.subItems.find((subItem)=>{return subItem.name === location});
		if(result)
		{
			return result.find(rack, frame, connector);
		}
		return null;
	};
	return newobj;
}

class VisualLocation extends VisualItem {
	constructor(map, name)
	{
		super("location", name, map);
		this.selectionOrder = 1;

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
		return true;
	}

	updatePosition()
	{
		this.cX = this.x;
		this.cY = this.y;
		super.updatePosition();
	}

	updateSize() 
	{
		if(this.collapseState)
		{
			this.height = DIM_RACK_LABEL_SIZE + DIM_RACK_SPACING;
			this.width = DIM_COLLAPSED_WIDTH;
			super.updateSize();
			return;
		}
		let maxh=0;
		this.subItems.forEach((item)=>{
			item.updateSize();
			maxh = maxh < item.height ? item.height : maxh;
		});
		this.width = this.subItems.length * (DIM_RACK_WIDTH+DIM_RACK_SPACING) + DIM_RACK_SPACING;
		this.height = maxh + DIM_RACK_LABEL_SIZE*2;
	}
	draw(ctx) 
	{
		ctx.strokeStyle = "black";
		
		ctx.lineWidth = 1;
		
		ctx.fillStyle = "white";
		const rect = this.getRect();
		ctx.fillRect(rect.x+0.5, rect.y+0.5, rect.width, rect.height);
		ctx.strokeRect(rect.x+0.5, rect.y+0.5, rect.width, rect.height);
		
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.font ="20px monospace";
		ctx.fillText(this.label, rect.x+rect.width/2, rect.y+DIM_RACK_SPACING-3);
		
		if(this.collapseState == true)
		{
			return;
		}
		super.draw(ctx);
	};
	
}

class VisualRack extends VisualItem {
	constructor(location, name)
	{
		super("rack", name, location);
		this.width = DIM_RACK_WIDTH;
		this.slot = -1;
		this.selectionOrder = 2;
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
		//TODO SLOT
		
		return true;
	}
	updateSize()
	{
		super.updateSize();
		this.height = this.subItems.length * (DIM_FRAME_BOTTOM+DIM_FRAME_HEIGHT) + DIM_RACK_LABEL_SIZE;
		
		this.width = DIM_RACK_WIDTH;
		if(this.collapseView)
		{
			this.height = 1;
			this.width = 1;
		}
	}
	updatePosition()
	{
		this.cX = this.x + this.parent.cX + this.slot * (this.width + DIM_RACK_SPACING) + DIM_RACK_SPACING;
		this.cY = this.y + this.parent.cY + DIM_RACK_LABEL_SIZE;
		
		if(this.collapseView)
		{
			this.cX = this.parent.cX + DIM_COLLAPSED_WIDTH/2;
			this.cY = this.parent.cY + 1;
		}
		super.updatePosition();
	};
	draw(ctx) 
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "black";
		const rect = this.getRect();
		ctx.strokeRect(rect.x+0.5, rect.y+0.5, rect.width, rect.height);
		ctx.font ="20px monospace";
		// label
		ctx.fillText(this.label, rect.x+this.width/2, rect.y+DIM_RACK_SPACING - 3);
		
		
		super.draw(ctx);
	}
}

class VisualFrame extends VisualItem
{
	constructor(rack, name)
	{
		super("frame", name, rack);
		this.selectionOrder = 3;
		this.height = DIM_FRAME_HEIGHT + DIM_FRAME_BOTTOM;
		this.width = DIM_RACK_WIDTH;
		this.slot = -1;
		this.frametype = "";
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
		if(this.slot === -1)
		{
			this.slot = this.parent.getNextSlot();
		}
		
		
		let ftpl = parser.inventory.find(this.frametype);
		if(!ftpl || ftpl.type!="frame_tpl")
		{
			parser.statevars['frame_tpl_name'] = this.frametype;
			parser.warn(WARN_BAD_FRAME_TPL);
			return false;
		}
		
		ftpl.elements.forEach((el)=>{
			switch(el.type)
			{
				case "connector":
				{
					let connref = parser.inventory.find(el.name);
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
					conn.x = el.x;
					conn.y = el.y;
					this.addItem(conn);

					break;
				}
				case "bank":
				{
					let bankref = parser.inventory.find(el.name);
					if(!bankref)
					{

						return false;
					}
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
				default:
				{
					return;
				}
			}
		});
		/*
		for(let i = 0; i<24;i++)
		{
			let conn = new VisualSocket(this, (i+1).toString());
			conn.slot = this.getNextSlot();
			this.addItem(conn);
		}
		//*/
		
		
		
		return true;
	}

	updateSize()
	{
		super.updateSize();
		this.height = DIM_FRAME_HEIGHT + DIM_FRAME_BOTTOM;
		this.width = DIM_RACK_WIDTH;
		if(this.collapseView)
		{
			this.height = 1;
			this.width = 1;
		}
	}
	updatePosition()
	{
		this.cX = this.x + this.parent.cX;
		//console.log("aaaaa",this.slot);
		this.cY = this.y + this.parent.cY + this.slot * (this.height + DIM_FRAME_SPACING) + DIM_RACK_LABEL_SIZE;
		
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
		
		ctx.strokeRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH, DIM_FRAME_HEIGHT);
		ctx.font ="20px monospace";
		// label
		ctx.fillText(this.label, rect.x+this.width/2, rect.y+this.height-DIM_FRAME_SPACING/2 -5);
		
		
		super.draw(ctx);
	}
}

class VisualSocket extends VisualItem
{
	connections = [];
	renderer = null;
	typename = "generic";
	constructor(frame, name)
	{
		super("socket", name, frame);
		this.selectionOrder = 5;
	}
	updateSize()
	{
		super.updateSize();
		//this.height = DIM_FRAME_HEIGHT;
		//this.width = 13;
	}
	updatePosition()
	{
		this.cX = this.x + this.parent.cX + DIM_FRAME_SIDES + 5;
		this.cY = this.y + this.parent.cY + 2;
		if(this.collapseView)
		{
			this.cX =this.parent.cX;
			this.cY = this.parent.cY;
		}
		super.updatePosition();
	}
	draw(ctx) 
	{
		const rr = new ItemRenderer(ctx, this.renderer.instructions);
		//console.log(rr);
		rr.render(this);
		return;
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		const rect = this.getRect();
		ctx.strokeRect(rect.x+0.5, rect.y+0.5 + 8, 9,23);
		ctx.font = "8px monospace";
		ctx.fillStyle = "rgb(237 28 36)";
		ctx.fillText((this.slot+1)+" ", rect.x + 6, rect.y+ 8 - 1);
		ctx.fillStyle = "rgb(0 100 200)";
		ctx.fillText(((this.slot+1)*2-1)+" ", rect.x + 6, rect.y+ 8+0.5+8);
		ctx.fillText(((this.slot+1)*2)+" ", rect.x + 6, rect.y+ 8+21);
			
	}

	connect(wire)
	{
		console.log("connected <", wire.getFullLabel(),"> to <", this.getFullLabel(), ">");
		this.connections.push(wire);
	}

	disconnect(wire)
	{
		console.log("disconnected <", wire.getFullLabel(),"> from <", this.getFullLabel(), ">");
		this.connections = this.connections.filter(item=>item!==wire);
	}
	canMove(wire)
	{
		return (wire.to == this || wire.from == this);
		
	}
	canAdd(wire)
	{
		const results = this.connections.filter(item=>item.parent == wire.parent);
		return results.length ==0;
	}
	canStart(wire)
	{
		const results = this.connections.filter(item=>item.parent == wire.parent);
		return results.length ==1;
	}
	getDrawingGroup()
	{
		return [this, ...this.connections];
	}

	takeFrom(other, line)
	{
		let thisIsFrom = line.from == other;
		let otherline = null;
		console.log("called with params",other, line);
			other.disconnect(line);
		if(thisIsFrom)
		{
			// find the other link on same connection
			otherline = line.from.connections.find((item)=>item.parent.name == line.parent.name);
			if(otherline)
				otherline.to = this;
			line.from = this;
			console.log("this line was STARTING at the target");
			console.log(line, otherline);
		}
		else
		{
			// find the other link on same connection
			otherline = line.to.connections.find((item)=>item.parent.name == line.parent.name);
			if(otherline)
				otherline.from = this;
			line.to = this;
			console.log("this line was ENDING at the target");
			console.log(line, otherline);

		}
			console.log("before disconnect");
			console.log(this, line, other, otherline);
			console.log("after disconnect");
			if(otherline)
				other.disconnect(otherline);
			this.connect(line);
			if(otherline)
				this.connect(otherline);
			console.log(this, line, other, otherline);

	}
}




class VisualLineMap extends VisualItem
{
	constructor(name){
		 super("linemap", name, null);
		}

}

class VisualLine extends VisualItem {
	constructor(map, name) {
		super("line", name, map);
		this.colour1 = "#808080";
		this.colour2 = "#808080";
	}

	getDrawingGroup()
	{
		const grp = [];
		this.subItems.forEach((item)=>{
			grp.push(...item.getDrawingGroup());
		});
		return grp;
	}
}

class VisualPatch extends VisualItem {
	constructor(line, name)	{
		super("patch", name, line);
		this.from = null;
		this.to = null;
		this.selectionOrder = 4;
		this.cable ="";
	}
	commit(parser)
	{
		this.to.connect(this);
		this.from.connect(this);
		return true;
	}
	updateSize()
	{
		super.updateSize();

	}
	updatePosition()
	{
		const startX = this.from.cX;
		const startY = this.from.cY;
		const endX = this.to.cX + this.to.width;
		const endY = this.to.cY + this.to.height;
		const dX = endX-startX;
		const dY = endY - startY;
		this.flip = (dX*dY) < 0;
		this.cX = startX > endX ? endX : startX;
		this.cY = startY > endY ? endY : startY;
		this.width = Math.abs(dX);
		this.height = Math.abs(dY);

		super.updatePosition();
	}

	testHit(x, y)
	{
		return this.getRect().diagonal(x, y, 6, this.flip);
	}
	draw(ctx)
	{
		ctx.save();
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(this.from.cX+3, this.from.cY+3);
		ctx.lineTo(this.to.cX+3,this.to.cY+this.to.height-3);
		ctx.strokeStyle =this.parent.colour1;
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(this.from.cX-3+this.to.width, this.from.cY+3);
		ctx.lineTo(this.to.cX-3+this.to.width,this.to.cY+this.to.height-3);
		ctx.strokeStyle =this.parent.colour2;
		ctx.stroke();
		ctx.restore();

	}
	drawOutlineFunc(ctx)
	{
		ctx.beginPath();
		ctx.moveTo(this.from.cX+3, this.from.cY+3);
		ctx.lineTo(this.to.cX+3,this.to.cY+this.to.height-3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(this.from.cX-3+this.to.width, this.from.cY+3);
		ctx.lineTo(this.to.cX-3+this.to.width,this.to.cY+this.to.height-3);
		ctx.stroke();

	}
	getDrawingGroup()
	{
		return [this.from,this,this.to];
	}
}


class VisualRenderer extends VisualItem {
	instructions = [];
	constructor(parent, name)
	{
		super("renderer",name, parent);
	}

}

class VisualConnectorTemplate extends VisualItem {
	constructor(parent, name)
	{
		super("socket_tpl",name, parent);
	}
}

class VisualConnectorBank extends VisualItem {
	elements = [];
	constructor(parent, name)
	{
		super("socket_bank",name, parent);
	}
}

class VisualFrameTemplate extends VisualItem {
	elements = [];
	constructor(parent, name)
	{
		super("frame_tpl", name, parent);
	}
}

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