

/**
 * Represents a fixed location grouping racks and other such items.
 */
class VisualLocation extends VisualItem {
	cables =[];
	cablesEnds={top:[],left:[],bottom:[],right:[]};
	quadAngle = 0;
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
	pickSide(other)
	{
		// this centre
		let aX=this.x+(this.width/2);
		let aY=this.y+(this.height/2);
		// other centre
		let bX=other.x+(other.width/2);
		let bY=other.y+(other.height/2);
		// determine the angle (respective to the X axis)
		let angle = Math.atan2(bY-aY, bX-aX);
		if(Math.abs(angle)<this.quadAngle)
			return "right";
		if(Math.abs(angle)>Math.PI-this.quadAngle)
			return "left";
		if(angle>0)
			return "bottom";
		return "top";
	}
	doSideSpread(side)
	{
		// console.log(this.cablesEnds);
		let ends = this.cablesEnds[side];
		const cablespacing = 3; // px
		const offsets = [];
		let tally = 0;
		ends.forEach((e)=>{
			let w = e.cableWidth;
			offsets.push(tally+w/2);
			tally+=cablespacing;
			tally+=w;
		});
		let offset;
		if(side=="top"||side=="bottom")
		{
			offset = this.width/2-tally/2;
		}
		else
		{
			offset = this.height/2-tally/2;
		}
		// offsets.push(tally);
		return offsets.map((x)=>x+offset+0.5);
		for(let i=0;i<ends.length;i++)
		{

		}
	}
	updatePosition()
	{
		// top level item, so renders at actual coordinates
		this.cX = this.x;
		this.cY = this.y;
		this.cablesEnds={top:[],left:[],bottom:[],right:[]};
		// assign cable ends to the edges of the rectangle
		this.cables.forEach((cable)=>{
			let side;
			if(cable.fromBld == this)
			{
				side = this.pickSide(cable.toBld);
			}
			if(cable.toBld == this)
			{
				side = this.pickSide(cable.fromBld);
			}
			this.cablesEnds[side].push(cable);
		});


		let ls=this.doSideSpread("left");

		this.cablesEnds.left.forEach((e,i)=>{
			if(isNaN(ls[i]))
				console.warn("LS",ls,this.cablesEnds);
			const sp={x:this.x, y:this.y+ls[i]};
			if(e.fromBld == this)
			{
				e.startPoint = sp;
			}
			if(e.toBld == this)
			{
				e.endPoint = sp;
			}

		});

		let rs=this.doSideSpread("right");

		this.cablesEnds.right.forEach((e,i)=>{
			if(isNaN(rs[i]))
				console.warn("RS",rs,this.cablesEnds);
			const sp={x:this.x+this.width, y:this.y+rs[i]};
			if(e.fromBld == this)
			{
				e.startPoint = sp;
			}
			if(e.toBld == this)
			{
				e.endPoint = sp;
			}

		});
		let ts=this.doSideSpread("top");

		this.cablesEnds.top.forEach((e,i)=>{
			if(isNaN(ts[i]))
				console.warn("TS",ts,this.cablesEnds);
			const sp={x:this.x+ts[i], y:this.y};
			if(e.fromBld == this)
			{
				e.startPoint = sp;
			}
			if(e.toBld == this)
			{
				e.endPoint = sp;
			}

		});

		let bs=this.doSideSpread("bottom");

		this.cablesEnds.bottom.forEach((e,i)=>{
			if(isNaN(bs[i]))
				console.warn("BS",bs,this.cablesEnds);
			const sp={x:this.x+bs[i], y:this.y+this.height};
			if(e.fromBld == this)
			{
				e.startPoint = sp;
			}
			if(e.toBld == this)
			{
				e.endPoint = sp;
			}

		});

		//console.log(ls,rs,ts,bs,this.name);






		super.updatePosition();
	}

	updateSize() 
	{
		if(this.collapseState)
		{
			// render a collapsed location tall enough to show its label
			this.height = DIM_RACK_LABEL_SIZE + DIM_RACK_SPACING;
			this.width = DIM_COLLAPSED_WIDTH;
			this.quadAngle=Math.atan(this.height/this.width);
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
		this.quadAngle=Math.atan(this.height/this.width);
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