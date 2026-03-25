
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
	createClonedView(parent)
	{
		let clone = new VisualRenderer(parent,this.name);
		this.instructions.forEach((e)=>{
			clone.instructions.push([...e]);
		});
		return clone;
	}
}