declare module "json-logic-js" {
  const jsonLogic: {
    apply<R = any>(logic: any, data?: any): R;
    is_logic(logic: any): boolean;
    compile(logic: any): (data?: any) => any;
    rule_like(logic: any): boolean;
  };
  export default jsonLogic;
}
