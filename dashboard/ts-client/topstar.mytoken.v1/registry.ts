import { GeneratedType } from "@cosmjs/proto-signing";
import { MsgUpdateParams } from "./types/topstar/mytoken/v1/tx";
import { MsgMint } from "./types/topstar/mytoken/v1/tx";
import { MsgBurn } from "./types/topstar/mytoken/v1/tx";
import { MsgTransferWithTax } from "./types/topstar/mytoken/v1/tx";

const msgTypes: Array<[string, GeneratedType]>  = [
    ["/topstar.mytoken.v1.MsgUpdateParams", MsgUpdateParams],
    ["/topstar.mytoken.v1.MsgMint", MsgMint],
    ["/topstar.mytoken.v1.MsgBurn", MsgBurn],
    ["/topstar.mytoken.v1.MsgTransferWithTax", MsgTransferWithTax],
    
];

export { msgTypes }