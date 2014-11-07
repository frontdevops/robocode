
export function degrees2radians(degrees) {
	// convert degrees to radians
	return degrees * (Math.PI / 180);
}

export function distance(...args) {
	return euclidDistance.apply(this, args);
}

export function euclidDistance(x1, y1, x2, y2) {
	// calculate euclidean distance between 2 points
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export function inRect(x1, y1, x2, y2, width, height) {
	// calculate if point(x1,y1) is in rect(x2, y2, width, height)
	return ((x2 + width) > x1 && x1 > x2) && ((y2 + height) > y1 && y1 > y2);
}

export function isPointInSquare(...args) {
	return inRect.apply(this, args);
}
