const LQR1 = (error, a, max)=>{
    let k = [
        [   0,      1.0000, 0,      1.7321, 0,      0],
        [   1.0000, 0,      1.7220, 0,      9.6298, 2.9502]
    ];
    let res = multMatColVec(k, error);
    res[0] += 9.81 / Math.cos(a);
    res[1] = Math.tanh(res[1]*2/max)*max/2;
    return res;
}
const LQR1_limited = (error, a, max)=>{
    let k = [
        [   0,      1.0000, 0,      1.7321, 0,      0],
        [   1.0000, 0,      1.7220, 0,      9.6298, 2.9502]
    ];
    let res = multMatColVec(k, error);
    res[0] += 9.81 / Math.cos(a);
    res[0] = Math.max(0,Math.min(res[0], max));
    res[1] = Math.tanh(res[1]*2/max)*max/2;

    let mag = Math.abs(a);
    if(mag > Math.PI/4){
        // Get distance from 45 degrees, normalized up to 90 degrees
        let m = Math.min((mag - (Math.PI/4)) / (Math.PI/4), 1);
        // Maximum override control
        let o = (a>0?-max:max)/2;
        let c = res[1];
        res[1] = o*m + c*(1-m);
        // Ensure the total differential can be used
        if(Math.abs(res[1]) > res[0]){
            res[0] = Math.abs(res[1]);
        }
    }

    return res;
}

drones.push(new Drone(new Vec2(1,0.2), 2, 0.2, new Vec2(), 40, new Vec2(0.5,0.2), LQR1, "firebrick", 0));
drones.push(new Drone(new Vec2(1,0.2), 2, 0.2, new Vec2(), 40, new Vec2(0.5,0.2), LQR1, "goldenrod", 0));
drones.push(new Drone(new Vec2(1,0.2), 2, 0.2, new Vec2(), 40, new Vec2(0.5,0.2), LQR1_limited, "purple", 0));
drones.push(new Drone(new Vec2(1,0.2), 2, 0.2, new Vec2(), 40, new Vec2(0.5,0.2), LQR1_limited, "darkGreen", 0));