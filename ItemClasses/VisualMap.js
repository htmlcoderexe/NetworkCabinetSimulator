
/**
 * Container for fixed installations, parent item for Locations
 */
class VisualMap extends VisualItem {
	constructor(name)
	{
		super("map", name);
	}
	doCables()
	{
		this.subItems.forEach((e)=>{
			if(e.type=="location")
				e.cables=[];
			
		});
		this.subItems.forEach((e)=>{
			if(e.type=="cable")
			{
				e.from.parent.parent.cables.push(e);
				e.to.parent.parent.cables.push(e);
			}
			
		});
		this.subItems.forEach((e)=>{
			if(e.type=="location")
				console.log(e.cables);
			
		});
	}
	updatePosition()
	{
		this.doCables();
		super.updatePosition();
	}
}