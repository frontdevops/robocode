function trait(derivedActor, baseActors) {
    baseActors.forEach(function (baseActor) {
        Object.getOwnPropertyNames(baseActor.prototype).forEach(function (name) {
            derivedActor.prototype[name] = baseActor.prototype[name];
        });
    });
}
//# sourceMappingURL=traits.js.map