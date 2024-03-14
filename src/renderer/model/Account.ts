export class Account {
  index: number;
  username: string;
  password: string;
  ip: string; // 服务器IP地址
  primaryDNS: string;     // 主DNS地址
  secondaryDNS: string;   // 备DNS地址
  ipAddress: string;      // ip地址
  subnetMask: string = "255.255.255.0";      // 子网掩码
  defaultGateway: string; // 默认网关
}

