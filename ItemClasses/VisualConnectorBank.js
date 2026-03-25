

/**
 * Represents a connector bank - a collection of connectors
 */
class VisualConnectorBank extends VisualItem {
	elements = [];
	render_list = [];
	counter=0;
	constructor(parent, name)
	{
		super("socket_bank",name, parent);
	}
	updateSize()
	{
		this.subItems.forEach((e)=>{
			let connref = this.parent.find(e.ref);
			if(!connref)
				return;
			
			this.height=Math.max(this.height, e.y+connref.height);
			this.width=Math.max(this.width, e.x+connref.width);
			e.updateSize();
		});
		// console.log(this.getRect());
	}
	draw(ctx)
	{
		if(!this.parent)
			return;
		let counter = this.counter;
		
		this.subItems.forEach((e)=>{
			let connref = this.parent.find(e.ref);
			if(!connref)
				return;
			
			connref.slotLabel=counter.toString();
			connref.slot=slot;
			if(counter==-1)
			{
				connref.slotLabel="M";
			}
			if(counter==-2)
			{
				connref.slotLabel="C";
			}
			ctx.translate(e.x+this.x,e.y+this.y);
			//connref.counter=this.counter;
			connref.draw(ctx);
			ctx.translate(-e.x-this.x,-e.y-this.y);
			counter++
		});		
		this.counter=counter;
	}
}

class VisualBankPlacement extends VisualItem {
	ref="";
	constructor(parent,name)
	{
		super("bank",name,parent);
	}
	updateSize()
	{
			let connref = this.root.find(this.ref);
			if(!connref)
				return;
			
			
			this.height=connref.height;
			this.width=connref.width;
	}
}