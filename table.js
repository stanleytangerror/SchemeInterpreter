var env = Env('initial', null);

function clear() {
      env = Env('initial', null);
}

function interp(codes) {
      if (env === null)
            clear();
      // debugger
      // document.getElementById('output').innerHTML = '<p>' + JSON.stringify(codes) + '<\p>';
      document.getElementById('output').innerHTML = 
            codes.reduce(function(preStr, curCode, idx, arr) {
                  return preStr 
                  + '<p><samp> > ' 
                  + output_data(eval(curCode, env)) 
                  + '\tenv: '
                  + output_env(env)
                  + '</p></samp>'; }, '');
}

function show_syntax() {
      var str = document.getElementById('input-code').value;
      var codes = sexp_parse(str);
      document.getElementById('output').innerHTML = 
            codes.reduce(function(preStr, curCode, idx, arr) {
                  return preStr 
                  + '<p><samp> > ' 
                  + JSON.stringify(codes)
                  + '</p></samp>'; }, '');
}

function run() {
      var str = document.getElementById('input-code').value;
      var codes = sexp_parse(str);
      interp(codes);
}

function inc() {
      document.getElementById('input-code').value = '(define inc (lambda (x) (+ x 1)))\n' 
      + '(inc 2)';
}

function add() {
      document.getElementById('input-code').value = '(define add (lambda (x y) (+ x y)))\n' 
      + '(add 2 3)';
}

function max() {
      document.getElementById('input-code').value = '(define max (lambda (x y) (if (> x y) x y)))\n' 
      + '(max 6 8)';
}

function tokenize(str) {
      // debugger
      function lst2str(preVal, curVal, idx, arr) { return preVal + curVal; }
      var tokens = [];
      var i = 0;
      var stack = [];
      while (i < str.length) {
            switch (str[i]) {
                  case ')':
                  if (tokens.length == 0)
                  return [];
                  if (stack.length > 0) {
                  tokens.push(stack.reduce(lst2str, ''));
                  stack = [];
                  }
                  tokens.push(str[i]);
                  i++;
                  break;
                  case '(':
                  if (stack.length > 0) {
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
                  case '\n':
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
      // debugger
      var tokens = tokenize(str);
      var i = 0;
      var exp = [];
      exp.push([]);
      // debugger
      while (i < tokens.length) {
            switch (tokens[i]) {
                  case '(':
                  exp.push([]);
                  i++;
                  break;
                  case ')':
                  var subexp = exp.pop();
                  // if (exp.length == 0)
                        // exp.push(subexp);
                  // else
                        exp[exp.length - 1].push(subexp);
                  i++;
                  break;
                  default:
                  exp[exp.length - 1].push(tokens[i]);
                  i++;
                  break;                        
            }
      }
      if (exp.length != 1)
            return [];
      return exp[0];
}

function is_leaf(obj) {
      return !(Object.prototype.toString.call(obj) === '[object Array]');
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

/** ================================================
*     environment data type:
*     to make function as first class data type,
*     treat function as a procedure with a id string
*     environment is a [string:idstr, object:val] map
*   ================================================
*/

function Env(overload, obj) {
      switch (overload) {
            case 'initial':
            return {};
            case 'copy':
            return deepcopy(obj);      
      }
}

function ext_env(id, val, env) {
      var new_env = Env('copy', env);
      new_env[id] = val;
      return new_env;
}

function def_var_ex(id, val, env) {
      env[id] = val;
}

function look_up(id, env) {
      return deepcopy(env[id]);
}

function output_env(env) {
      var str = '';
      for (var key in env) {
            str += '(' + key + ', ' + output_data(env[key]) + '), ';
      }
      return str;
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

function Data_bool(str) {
      return Data('boolean', str); 
}

function Data_proc(args, body, env) {
      return Data('procedure', 
            {'arguments': args, 'body': body, 'environment': deepcopy(env)});
}

function lookup_var_val(data_var, env) {
      return look_up(data_var['val'], env);
}

function output_data(data) {
      if (data === null)
      return 'null';
      switch (data['type']) {
            case 'string':
            case 'variable':
            case 'number':
            return data['val'];
            case 'procedure':
            return 'procedure';
      }
}

function compare_data(data1, data2) {
     if (JSON.stringify(data1) !== JSON.stringify(data2))
            return false;
            return true;
}

/* ================================================
*   scheme primitive procedure
*  ================================================
*/

var prim_proc = {
      '#t': Data_bool('#t'),
      '#f': Data_bool('#f'),
      '=': function(params) {
            if (params.length != 2)
            return Data_bool('#f');
            if (!compare_data(params[0], params[1]))
            return Data_bool('#f');
            return Data_bool('#t');
                  },
       '>': function(params) {
            if (params.length != 2)
            return Data_bool('#f');
            if (params[0]['type'] !== 'number' || params[1]['type'] !== 'number')
            return Data_bool('#f');
            if (params[0]['val'] > params[1]['val'])
            return Data_bool('#t');
            else
            return Data_bool('#f');
                  },
       '<': function(params) {
            if (params.length != 2)
            return Data_bool('#f');
            if (params[0]['type'] !== 'number' || params[1]['type'] !== 'number')
            return Data_bool('#f');
            if (params[0]['val'] < params[1]['val'])
            return Data_bool('#t');
            else
            return Data_bool('#f');
                  },
      '+': function(params) {
            var val = params.map(function(v) {
                  return v['val'];
            }).reduce(function(preVal, curVal, idx, arr) { 
                        return preVal + curVal; });
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
      
function is_prim_proc(code) {
      return code[0] in prim_proc;      
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
      if (is_if(code))
            return eval_if(code, env);
      if (is_lambda(code))
            return eval_lambda(code, env);
      if (is_apply(code))
            return eval_apply(code, env);
}

function is_num(code) {
      if (!is_leaf(code) || !(typeof code === 'string'))
            return false;
      return !isNaN(code);
}

function eval_num(code) {
      return Data_num(code);
}

function is_str(code) {
      if (!is_leaf(code) || !(typeof code === 'string'))
            return false;
     if (code.match("\".*\""))
            return true;
     return false;
}

function eval_str(code) {
      return Data_str(code);
}

function is_var(code) {
      if (!is_leaf(code) || !(typeof code === 'string'))
            return false;
     if (!is_num(code) && !is_str(code))
            return true;
     return false;
}

function eval_var(code, env) {
     return lookup_var_val(Data_var(code), env);
}

function is_define(code) {
     if (is_leaf(code))
     return false;
     return code[0] === 'define';      
}

function eval_define(code, env) {
     var data_var = Data_var(code[1]);
     var data_exp = eval(code[2], env);
     def_var_ex(data_var['val'], data_exp, env);
     return null;
}

function is_if(code) {
     if (is_leaf(code))
     return false;
     return code[0] === 'if' && code.length == 4;
}

function eval_if(code, env) {
      debugger
      if (compare_data(eval(code[1], env), prim_proc['#t']))
            return eval(code[2], env);
      else
            return eval(code[3], env);
}

function is_lambda(code) {
      // debugger
     if (is_leaf(code))
     return false;
     return code[0] === 'lambda' && code.length >= 3;
}

function eval_args(code, env) {
     return Data_var(code);
}

function eval_lambda(code, env) {
      // debugger
      var args = [];
      code[1].forEach(function(child){
            args.push(eval_args(child, env));});
      var body = code.slice(2, code.length);
      return Data_proc(args, body, env);
}

function is_apply(code) {
      return (!is_leaf(code)) && code.length > 0;
}

function eval_apply(code, env) {
      // var proc = prim_proc[code['data']];
      // debugger
      var len = code.length;
      var params = [];
      code.slice(1, code.length).forEach(function(child){
            params.push(eval(child, env));});
      if (is_prim_proc(code))
            return apply_prim_proc(prim_proc[code[0]], params, env);
      else {
            var proc = eval(code[0], env);
            return apply_comp_proc(proc, params, env);
      }
}

function eval_sequence(codes, env) {
      var len = codes.length;
      var i = 0;
      for (; i < len - 1; ++i) {
            eval(codes[i], env);
      }
      return eval(codes[len - 1], env);
}

function apply_prim_proc(proc, params, env) {
      // debugger
      return proc(params);
}

function apply_comp_proc(proc, params, env) {
      var i = 0;
      var new_env = Env('copy', env);
      for (; i < params.length; ++i)
            new_env = ext_env(proc['val']['arguments'][i]['val'], params[i], new_env);
      return eval_sequence(proc['val']['body'], new_env);
}
