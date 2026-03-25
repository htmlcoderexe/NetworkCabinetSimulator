
/**
 * Represents a connector template
 */
class VisualConnectorTemplate extends VisualItem {
	renderer=null;
	counter=0;
	commit(parser)
	{
		let renderer = this.find("renderer");
		this.renderer = renderer;
		this.removeItem(renderer);
		return true;
	}
	constructor(parent, name)
	{
		super("socket_tpl",name, parent);
	}
	draw(ctx)
	{
		// fill out the socket's dimensions with white background
		ctx.fillStyle="#FFFFFF";
		ctx.fillRect(this.cX+0.0,this.cY+1,this.width,this.height-2);
		// run the renderer to draw the actual socket
		const rr = new ItemRenderer(ctx, this.renderer.instructions);
		rr.render(this);
		this.counter++;
	}
}

class VisualConnectorPlacement extends VisualItem {
	ref="";
	factoryLabel="";
	constructor(parent,name)
	{
		super("connector",name,parent);
	}
	updateSize()
	{
			let connref = this.root.find(this.ref);
			if(!connref)
				return;
			
			this.height=connref.height;
			this.width=connref.width;
			// console.log(this);
	}
}

class VisualPortOptions extends VisualItem {
	counter =undefined;
	tpl=undefined;
	constructor(parent,name)
	{
		super("port_options",name,parent);
	}

}