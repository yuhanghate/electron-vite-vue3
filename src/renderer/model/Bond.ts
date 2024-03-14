export class Bond {
  id: number;
  enabled: boolean;
  workMode: number;
  primaryIf: number;
  ethernetIfId: number;
  link: Link = new Link();
  ipAddress: IPAddress = new IPAddress();
}

class Link {
  MACAddress: string; // MAC地址
  autoNegotiation: boolean; // 默认true
  speed: number; // 默认0
  duplex: string; // 默认full
  MTU: number; // 默认1500
}

class IPAddress {
  ipVersion: string; // 默认dual
  addressingType: string; // 默认static
  ipAddress: string; // 默认192.168.1.64
  subnetMask: string; //255.255.255.0
  ipv6Address: string; // ::
  bitMask: number; // 0
}
