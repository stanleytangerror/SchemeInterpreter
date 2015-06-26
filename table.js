function parse() {
      var str = document.getElementById('input-code').value;
      document.getElementById('output').innerHTML = JSON.stringify(sexp_parse(str));
}

function tokenize(str) {
      function lst2str(preVal, curVal, idx, arr) { return preVal + curVal; }
      var tokens = [];
      var i = 0;
      var stack = [];
      while (i < str.length) {
            switch (str[i]) {
                  case ')':
                  if (tokens.length == 0)
                  return [];
                  tokens.push(stack.reduce(lst2str, ''));
                  stack = [];
                  tokens.push(str[i]);
                  i++;
                  break;
                  case '(':
                  if (tokens.length > 0) {
                  tokens.push(stack.reduce(lst2str, ''));
                  stack = [];
                  }
                  tokens.push(str[i]);
                  i++;
                  break;
                  case ' ':
                  if (stack.length > 0) {
                        tokens.push(stack.reduce(lst2str, ''));
                        stack = [];
                  }
                  i++;
                  break;
                  default:
                  stack.push(str[i]);
                  i++;
                  break;    
            }
      }
                        if (stack.length > 0) {
                        tokens.push(stack.reduce(lst2str, ''));
                        stack = [];
                  }
      return tokens;
}

function sexp_parse(str) {
      var tokens = tokenize(str);
      var i = 0;
      var stack = [];
      var brackets = [];
      // debugger
      while (i < tokens.length) {
            switch (tokens[i]) {
                  case '(':
                  brackets.push(stack.length);
                  i++;
                  break;
                  case ')':
                  var idx = brackets.pop();
                  var children = [];
                  while (stack.length > idx + 1) {
                        var top = stack.pop();
                        children.splice(0, 0, top);
                  }
                  var cur = stack.pop();
                  cur['children'] = children;
                  stack.push(cur);
                  i++;
                  break;
                  default:
                  stack.push({'data': tokens[i]});
                  i++;
                  break;                        
            }
      }
      if (stack.length != 1)
            return [];
      return stack[0];
}

function is_leaf(obj) {
      if (obj.hasOwnProperty('children'))
            return false;
            return true;
}

function deepcopy(src) {
      switch (typeof src) {
                  case 'string':
                  case 'number':
                  case 'boolean':
                  return src;
                  case 'object':
                  var tp = Object.prototype.toString.call(src);
                  if (tp === '[object Array]')
                  return deepcopy_array(src);
                  else
                  return deepcopy_object(src);
      }
      
      function deepcopy_object(obj) {
            // debugger
            var dest = {};
            for (var key in obj) 
                  if (obj.hasOwnProperty(key)) 
                        dest[key] = deepcopy(obj[key]);
            return dest;
      }
      
      function deepcopy_array(arr) {
            var dest = [];
            arr.forEach(function(e){
                  dest.push(deepcopy(e));
            });
            return dest;
      }
}

function Closure(func, env) {
      return {
            'func': func,
            'env' : env
      };
}

/** ================================================
*     environment data type:
*     to make function as first class data type,
*     treat function as a procedure with a id string
*     environment is a [string:idstr, object:val] map
*   ================================================
*/

function Env(overload, opts) {
      switch (overload) {
            case 'initial':
            return {};
            case 'copy':
            return deepcopy(opts['from']);      
      }
}

function ext_env(id, val, env) {
      var new_env = Env('copy', {'from': env});
      new_env[id] = val;
      return new_env;
}

function def_var(id, val, env) {
      env[id] = val;
}

function look_up(id, env) {
      return deepcopy(env[id]);
}

/** ================================================
*   median representation:
*       {
*           'type':...,
*           'val':...,
*           ...
*       }
*   make code as data, 
*   stored in env's value, rather than env's key
*   ================================================
*/

function Data(typ, val) {
      return {
            'type': typ,
            'val': val
            };
}

function Data_num(str) {
      return Data('number', Number(str)); 
}

function Data_str(str) {
      return Data('string', str); 
}

function Data_var(str) {
      return Data('variable', str); 
}

function Data_proc(name, params, body, env) {
      return Data('procedure', 
            {'parameters': params, 'body': body, 'environment': deepcopy(env)});
}

function lookup_var_val(data_var, env) {
      return look_up(data_var['val'], env);
}

/* ================================================
*   eval exp
*  ================================================
*/

function eval(code, env) {
      debugger
      if (is_num(code))
            return eval_num(code, env);
      if (is_str(code))
            return eval_str(code, env);
      if (is_var(code))
            return eval_var(code, env);
      if (is_define(code))
            return eval_define(code, env);
      if (is_apply(code))
            return eval_apply(code, env);
}

function is_num(code) {
      if (!is_leaf(code))
            return false;
      var str = code['data'];
      return !isNaN(str);
}

function eval_num(code) {
      var str = code['data'];
      return Data_num(str);
}

function is_str(code) {
      if (!is_leaf(code))
            return false;
     if (code['data'].match("\".*\""))
            return true;
     return false;
}

function eval_str(code) {
      var str = code['data'];
      return Data_str(str);
}

function is_var(code) {
      if (!is_leaf(code))
            return false;
     if (!is_num(code) && !is_str(code))
            return true;
     return false;
}

function to_var(code) {
      return Data_var(code['data']);
}

function eval_var(code, env) {
     return lookup_var_val(Data_var(code['data']), env);
}

function is_define(code) {
     if (is_leaf(code))
     return false;
     return code['data'] === 'define';      
}

function eval_define(code, env) {
     var data_var = Data_var(code['children'][0]['data']);
     var data_exp = eval(code['children'][1], env);
     return def_var(data_var['val'], data_exp, env);
}

function is_lambda(code) {
     if (is_leaf(code))
     return false;
     return code['data'] === 'lambda' && code['children'].length == 2;
}

function eval_lambda(code, env) {
      var params = code['children'][0].forEach(function(child){
            params.push(eval(child, env));});
      var body = code['children'][1];
      return 
}

function is_apply(code) {
      return (!is_leaf(code)) && code['children'].length > 0;
}

function eval_apply(code, env) {
      if (is_primi_proc(code))
            return apply_primi_proc(code, env);
      
}

var primi_proc = {     
      '+': function(params) {
            var val = params.reduce(
                  function(preVal, curVal, idx, arr) { 
                        return preVal['val'] + curVal['val']; });
            return Data_num(val);
                  },
      '-': function(params) {
            var val = params.reduce(
                  function(preVal, curVal, idx, arr) { 
                        return preVal['val'] - curVal['val']; });
            return Data_num(val);
                  },
      '*': function(params) {
            var val = params.reduce(
                  function(preVal, curVal, idx, arr) { 
                        return preVal['val'] * curVal['val']; });
            return Data_num(val);
                  },
      '/': function(params) {
            var val = params.reduce(
                  function(preVal, curVal, idx, arr) { 
                        return preVal['val'] / curVal['val']; });
            return Data_num(val);
                  },
      };
      
function is_primi_proc(code) {
      return code['data'] in primi_proc;      
}

function apply_primi_proc(code, env) {
      var proc = primi_proc[code['data']];
      var params = [];
      code['children'].forEach(function(child){
            params.push(eval(child, env));});
      return proc(params);
}
