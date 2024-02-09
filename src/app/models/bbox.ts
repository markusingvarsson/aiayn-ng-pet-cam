// Class to make bounding box distance checking easier.

export class BBox {
  width = 0;
  height = 0;
  midX = 0;
  midY = 0;

  constructor(bbox: [number, number, number, number]) {
    let x = bbox[0];
    let y = bbox[1];
    this.width = bbox[2];
    this.height = bbox[3];
    this.midX = x + this.width / 2;
    this.midY = y + this.height / 2;
  }

  distance(bbox: BBox) {
    let xDiff =
      Math.abs(this.midX - bbox.midX) - this.width / 2 - bbox.width / 2;
    let yDiff =
      Math.abs(this.midY - bbox.midY) - this.height / 2 - bbox.height / 2;

    // If xDiff < 0, the boxes intersect in the x plane. Thus the distance is just the
    // y height, or 0 if the boxes intersect in the y plane, too.
    if (xDiff < 0) {
      return Math.max(yDiff, 0);
    }

    // In this case, boxes intersect in y plane but not x plane.
    if (yDiff < 0) {
      return xDiff;
    }

    // BBoxes intersect in neither plane. Return the Euclidean distance between
    // the closest corners.

    // you, shall, not, pass, gahhhh - beroende på avståndet???
    return Math.sqrt(xDiff ** 2 + yDiff ** 2);
  }
}
