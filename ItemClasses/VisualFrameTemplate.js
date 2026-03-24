
/**
 * Represents a frame template
 */
class VisualFrameTemplate extends VisualItem {
	elements = [];
	nameTemplate="$";
	counter=0;
	renderer=null;
	constructor(parent, name)
	{
		super("frame_tpl", name, parent);
	}
	commit(parser)
	{
		let renderer = this.find("renderer");
		this.renderer = renderer;
		this.removeItem(renderer);
		return true;
	}
	draw(ctx)
	{
		if(!this.parent)
			return;
		
		if(this.renderer)
		{
			let renderer = new ItemRenderer(ctx,this.renderer.instructions);
			renderer.offX=5;
			renderer.render(this);
		}
		let counter = 0;
		let slot = 0;
		this.subItems.forEach((e)=>{
			if(e.type=="port_options" && e.counter!=undefined)
			{
				counter = e.counter;
				return;
			}
			let conn = this.parent.find(e.ref);
			if(!conn)
				return;
			ctx.translate(e.x+this.x,e.y+this.y);
			
			conn.slotLabel=counter.toString();
			conn.slot=slot;
			if(counter==-1)
			{
				conn.slotLabel="M";
			}
			if(counter==-2)
			{
				conn.slotLabel="C";
			}
			conn.counter=counter;
			conn.draw(ctx);
			ctx.translate(-e.x-this.x,-e.y-this.y);
			counter=conn.counter;
			conn.counter=0;
			slot++;
		});

	}
	populateFrame(frame, hw)
	{
		// reset values
		this.counter=0;
		this.nameTemplate="$";
		frame.renderer = this.renderer;
		this.subItems.forEach((el)=>{
			switch(el.type)
			{
				case "connector":
				{
					//console.error(el);
					let connref = hw.find(el.ref);
					//console.warn(connref);
					// make sure connector is valid
					if(!connref)
					{
						// this only fails the specific socket, not the whole frame
						return false;
					}
					let slot = frame.getNextSlot();
					// #TODO: more clear numbering system
					// currently slots are 0-indexed internally but 1-indexed
					// for naming and display
					let label =this.nameTemplate.replace("$",this.counter.toString());
					let conn = new VisualSocket(frame, label);
					conn.slot = slot;
					// the renderer is a subItem named "main"
					conn.renderer = connref.renderer;
					conn.width = connref.width;
					conn.height = connref.height;
					conn.x = el.x;
					conn.y = el.y;
					conn.slotLabel=this.counter.toString();
					if(this.counter==-1)
					{
						conn.slotLabel="M";
					}
					if(this.counter==-2)
					{
						conn.slotLabel="C";
					}
					if(el.factoryLabel)
					{
						// console.log(el.factoryLabel);
						conn.label=el.factoryLabel;
					}
					frame.addItem(conn);
					this.counter++;
					break;

				}
				// banks are collections of connectors
				case "bank":
				{
					//console.error(el);
					let bankref = hw.find(el.ref);
					//console.info(bankref);
					// validate the bank reference
					if(!bankref)
					{
						return false;
					}
					// same as the parent loop, go through each connector
					bankref.subItems.forEach((el2)=>{
						
						//console.info(el2);
						let connref = hw.find(el2.ref);
						//console.warn(connref);
						if(!connref)
						{
							return false;
						}
						let slot = frame.getNextSlot();
						let label =this.nameTemplate.replace("$",this.counter.toString());
						let conn = new VisualSocket(frame, label);
						conn.slot = slot;
						conn.renderer = connref.renderer;
						conn.width = connref.width;
						conn.height = connref.height;
						conn.x = el2.x + el.x;
						conn.y = el2.y + el.y;
						conn.slotLabel=this.counter.toString();
						if(this.counter==-1)
						{
							conn.slotLabel="M";
						}
						if(this.counter==-2)
						{
							conn.slotLabel="C";
						}
						frame.addItem(conn);
						this.counter++;
					});
					break;
				}
				case "port_options":
				{
					if(el.counter)
					{
						this.counter=el.counter;
					}
					if(el.tpl)
					{
						this.nameTemplate=el.tpl;
					}
					break;
				}
			}
		});
	}
}