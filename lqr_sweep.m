pkg load control

f = 1;
count = 2;
a0 = -pi/4;


Q = eye(6);
R = eye(2);

P=[];
L=[];
K=[];

for(i = 0:count)
    a = a0 - 2*i*a0/count;
    A = [
      0,  0,  1,  0,  0,  0;
      0,  0,  0,  1,  0,  0;
      0,  0,  0,  0,9.8,  0;
      0,  0,  0,  0,  0,  0;
      0,  0,  0,  0,  0,  1;
      0,  0,  0,  0,  0,  0
    ];
    B = [
      0,        0;
      0,        0;
      sin(a),   0;
      cos(a),   0;
      0,        0;
      0,       -f
    ];

    [p, l, k] = care(A, B, Q, R);
    P = cat(3,P,p);
    L = cat(3,L,l);
    K = cat(3,K,k);
    display(a);
    display(k);
;end