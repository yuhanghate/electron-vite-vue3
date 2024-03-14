export class NetworkInterface {
  id: number;
  link: Link = new Link();
  ipAddress: IPAddress = new IPAddress();
}

class IPAddress {
  ipVersion: string;  // 默认dual
  addressingType: string;  // 默认static
  ipAddress: string;  // 默认192.168.1.64
  subnetMask: string;  //255.255.255.0
  ipv6Address: string;  // ::
  bitMask: number;  // 0
  defaultGateway: DefaultGateway = new DefaultGateway();
  primaryDNS: PrimaryDNS = new PrimaryDNS();
  secondaryDNS: SecondaryDNS = new SecondaryDNS();
  DNSEnable: boolean;
}

class DefaultGateway {
  ipAddress: string;  // 默认0.0.0.0
}

class PrimaryDNS {
  ipAddress: string;  // 默认10.22.108.197
}

class SecondaryDNS {
  ipAddress: string;  // 默认10.22.108.198
}


class Link {
  MACAddress: string; // mac地址
  autoNegotiation: boolean; // 默认true
  speed: number; // 默认：0
  duplex: string; // 默认：full
  MTU: number; // 默认：1500
}
