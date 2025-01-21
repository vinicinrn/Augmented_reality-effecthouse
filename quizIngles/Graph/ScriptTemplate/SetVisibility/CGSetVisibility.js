/**
 * @file CGSetVisibility.js
 * @author liujiacheng
 * @date 2021/8/20
 * @brief CGSetVisibility.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const APJS = require('./amazingpro');

class CGSetVisibility extends BaseNode {
  constructor() {
    super();
    this.isVisible = true;
  }

  _registerResetCallback(sys, object, callbackFunctionArray, argsArray) {
    if (callbackFunctionArray.length != argsArray.length) {
      return;
    }

    if (sys.setterNodeInitValueMap && !this.sys.setterNodeGuidMap.has(object.guid.toString())) {
      const callBackFuncMap = new Map();
      for (let i = 0; i < callbackFunctionArray.length; ++i) {
        callBackFuncMap.set(callbackFunctionArray[i], [...argsArray[i]]);
      }
      sys.setterNodeGuidMap.add(object.guid.toString());
      sys.setterNodeInitValueMap.set(object.guid, callBackFuncMap);
    }
  }

  _updateScriptComponentRecursively(entity, enable) {
    const components = entity.getComponents();
    if (components && components.length > 0) {
      for (let i = 0; i < components.length; i++) {
        const comps = components[i];
        if (comps instanceof APJS.JSScriptComponent) {
          // Register Reset callback functions
          this._registerResetCallback(
            this.sys,
            comps,
            [(_comp, _enabled) => (_comp.enabled = _enabled)],
            [[comps.enabled]]
          );

          const compsEnable = CGSetVisibility.compsEnableMap.get(comps.guid.toString());
          if (compsEnable === undefined) {
            CGSetVisibility.compsEnableMap.set(comps.guid.toString(), comps.enabled);
          }
          comps.enabled = enable && CGSetVisibility.compsEnableMap.get(comps.guid.toString());
        }
      }
    }
    if (components && components.length > 0) {
      for (let i = 0; i < components.length; i++) {
        const comps = components[i];

        if (comps instanceof APJS.ScriptComponent) {
          // Register Reset callback functions
          this._registerResetCallback(
            this.sys,
            comps,
            [(_comp, _enabled) => (_comp.enabled = _enabled)],
            [[comps.enabled]]
          );

          const compsEnable = CGSetVisibility.compsEnableMap.get(comps.guid.toString());
          if (compsEnable === undefined) {
            CGSetVisibility.compsEnableMap.set(comps.guid.toString(), comps.enabled);
          }
          comps.enabled = enable && CGSetVisibility.compsEnableMap.get(comps.guid.toString());
        }
      }
    }
    const transform = entity.getComponent('Transform');
    if (transform && transform.isInstanceOf('Transform')) {
      const children = transform.getSceneObject().getChildren();
      for (let i = 0; i < children.length; i++) {
        if (children[i] instanceof APJS.SceneObject) {
          this._updateScriptComponentRecursively(children[i], enable);
        }
      }
    }
  }

  getOutput(index) {
    return this.isVisible;
  }

  execute(sys, dt) {
    if (this.inputs[1] !== null && this.inputs[1] !== undefined) {
      const object = this.inputs[1]();
      const visible = this.inputs[2]();

      if (object !== null && object !== undefined && object.isInstanceOf('Entity')) {
        this._registerResetCallback(
          this.sys,
          object,
          [(_object, _visible) => _object.setEnabledInHierarchy(_visible)],
          [[object.isEnabledInHierarchy()]]
        );
        if (true === visible) {
          object.setEnabledInHierarchy(visible);
          this._updateScriptComponentRecursively(object, visible);
        } else {
          this._updateScriptComponentRecursively(object, visible);
          object.setEnabledInHierarchy(visible);
        }
        this.isVisible = visible;
      } else {
        this.isVisible = null;
      }
    }
    if (this.nexts[0]) {
      this.nexts[0]();
    }
  }

  beforeStart(sys) {
    this.sys = sys;
  }

  resetOnRecord(sys) {
    this.isVisible = true;
  }
}
CGSetVisibility.compsEnableMap = new Map();
exports.CGSetVisibility = CGSetVisibility;
