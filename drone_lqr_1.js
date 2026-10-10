const LQR3_lerp = (error, a, max)=>{
    let step = Math.PI/4;
    let t = Math.max(Math.min(a/step,1),-1)+1;
    let i0 = Math.floor(t);
    let i1 = Math.ceil(t);
    let m = t-i0;

    let k3 = [
        [
            [-0.4354, 0.9003,-0.6089, 1.7249,-1.3134,-0.1628],
            [ 0.9003, 0.4354, 1.5506, 0.9752, 9.2284, 2.8907]
        ],
        [
            [   0,      1.0000, 0,      1.7321, 0,      0],
            [   1.0000, 0,      1.7220, 0,      9.6298, 2.9502]
        ],
        [
            [0.4354, 0.9003, 0.6089, 1.7249, 1.3134, 0.1628],
            [0.9003,-0.4354, 1.5506,-0.9752, 9.2284, 2.8907]
        ]
    ];
    let k = [
        [0,0,0,0,0,0],
        [0,0,0,0,0,0]
    ];
    for(let i=0;i<2;++i){
        for(let j=0;j<6;++j){
            k[i][j] = (1-m)*k3[i0][i][j] + m*k3[i1][i][j];
        }
    }
    let res = multMatColVec(k, error);
    res[0] += 9.81 / Math.cos(a);
    res[0] = Math.max(0,Math.min(res[0], max));
    return res;
}
const LQR3_lerp_limited = (error, a, max)=>{
    let res = LQR3_lerp(error, a, max);

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

const LQR3_quadlerp = (error, a, max)=>{
    let step = Math.PI/4;
    let t = Math.max(Math.min(a/(2*step),0.5),-0.5)+0.5;

    let k3 = [
        [
            [-0.4354, 0.9003,-0.6089, 1.7249,-1.3134,-0.1628],
            [ 0.9003, 0.4354, 1.5506, 0.9752, 9.2284, 2.8907]
        ],
        [
            [0,      1.0000, 0,      1.7321, 0,      0],
            [1.0000, 0,      1.7220, 0,      9.6298, 2.9502]
        ],
        [
            [0.4354, 0.9003, 0.6089, 1.7249, 1.3134, 0.1628],
            [0.9003,-0.4354, 1.5506,-0.9752, 9.2284, 2.8907]
        ]
    ];
    let k = [
        [0,0,0,0,0,0],
        [0,0,0,0,0,0]
    ];
    let w = [0.5*t*t-0.5*t, -t*t+1, 0.5*t*t+0.5*t];
    for(let i=0;i<2;++i){
        for(let j=0;j<6;++j){
            for(let n=0;n<3;++n){
                k[i][j] += w[n]*k3[n][i][j];
            }
        }
    }
    let res = multMatColVec(k, error);
    res[0] += 9.81 / Math.cos(a);
    res[0] = Math.max(0,Math.min(res[0], max));
    return res;
}
const LQR3_quadlerp_limited = (error, a, max)=>{
    let res = LQR3_quadlerp(error, a, max);

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