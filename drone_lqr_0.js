const LQR1 = (error, a)=>{
    let k = [
        [   0,      1.0000, 0,      1.7321, 0,        0],
        [  -1.0000, 0,     -1.9383, 0,     -13.5088, -5.2932]
    ];
    let res = multMatColVec(k, error);
    res[0] += 9.81 / Math.cos(a);
    return res;
}

drones.push(new Drone(new Vec2(1,0.2), 2, 1, new Vec2(), 20, new Vec2(0.5,0.2), LQR1, "firebrick", 0));
drones.push(new Drone(new Vec2(1,0.2), 2, 1, new Vec2(), 20, new Vec2(0.5,0.2), LQR1, "goldenrod", 0));