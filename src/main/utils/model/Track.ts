export class Track{
    id:number;
    Channel:number;
    Enable:boolean;
    Description:string;
    TrackGUID:string;
    Size:number;
    Duration:string = "P0DT0H";
    DefaultRecordingMode:string = "CRM";
    SrcDescriptor:SrcDescriptor = new SrcDescriptor();
    CustomExtensionList:CustomExtensionList = new CustomExtensionList();
}

class SrcDescriptor{
    SrcGUID:string;
    SrcChannel:number;
    StreamHint:string = "";
    SrcDriver:string = "";
    SrcType:string = "";
    SrcUrl:string;
    SrcUrlMethods:string = "";
    SrcLogin: string = "";

}

class CustomExtensionList{
    CustomExtension:CustomExtension = new CustomExtension();
}

class CustomExtension{
    CustomExtensionName:string;
    enableSchedule:boolean;
    SaveAudio:boolean;
    PreRecordTimeSeconds:number;
    PostRecordTimeSeconds:number;
    HolidaySchedule:HolidaySchedule = new HolidaySchedule();
}

class HolidaySchedule{
    ScheduleBlock:ScheduleBlock = new ScheduleBlock();
}

class ScheduleBlock{
    ScheduleBlockGUID:string = "{00000000-0000-0000-0000-000000000000}";
    ScheduleBlockType:string = "www.std-cgi.com/racm/schedule/ver10";
}

