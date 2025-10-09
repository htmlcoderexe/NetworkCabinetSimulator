

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