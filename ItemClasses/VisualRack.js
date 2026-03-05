
/**
 * Represents a single rack of equipment (Frames)
 */
class VisualRack extends VisualItem {

	lowestSlot = 0;
	highestSlot = 1000;
	constructor(location, name)
	{
		super("rack", name, location);
		// standard width
		this.width = DIM_RACK_WIDTH;
		// if not set later, will be dynamically assigned
		this.slot = -1;
		this.selectionOrder = 2;
	}
	freeSlot(slot)
	{
		if(!this.checkSlot(slot))
			return;
		this.bumpSlot(slot);
	}
	bumpSlot(slot)
	{
		if(this.checkSlot(slot+1))
		{
			this.bumpSlot(slot+1);
		}
		let frame = this.getAtSlot(slot);
		frame.slot++;
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
		this.subItems.sort((a,b)=>a.slot-b.slot);
		// calculate the lowest and highest slot numbers
		let lowestslot = 1000; // reasonable
		let highestslot = 0;
		// the rack will render from lowest non-empty slot to highest non-empty slot
		let span = 0;
		// the -1 and +1 are used for conversion between 0-based and 1-based enumerations
		this.subItems.forEach((f)=>{
			lowestslot = Math.min(f.slot-1, lowestslot);
			highestslot = Math.max(f.slot-1, highestslot);
		});
		this.lowestSlot = lowestslot+1;
		this.highestSlot = highestslot+1;
		// calculate the number of slots the rack spans, at least 1
		span = Math.max(1,(highestslot-lowestslot+1));
		this.height = span * (DIM_FRAME_BOTTOM+DIM_FRAME_HEIGHT) + DIM_RACK_LABEL_SIZE;
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