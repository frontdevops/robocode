/**
 * trait(SmartObject, [ Disposable, Activatable ])
 * @param derivedActor
 * @param baseActors
 */
function trait(derivedActor: any, baseActors: any[]) {

	baseActors.forEach(

		baseActor => {
			Object
				.getOwnPropertyNames( baseActor.prototype )
				.forEach(
					name => {
						derivedActor.prototype[ name ] = baseActor.prototype[ name ];
					}
				);
		}

	);

}
